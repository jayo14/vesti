from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from wardrobe.models import WardrobeItem
from products.models import Product
from studio.models import Generation
from .serializers import AIRequestSerializer, GenerateSerializer
from .vision_client import VisionEngineError, tryon as run_tryon, enhance as run_enhance, \
    pose as run_pose, parse as run_parse, measurements as run_measurements, \
    garment_segment as run_garment_segment


class OutfitRecommendView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = AIRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        items = WardrobeItem.objects.filter(user=request.user)
        if serializer.validated_data.get('wardrobe_item_ids'):
            items = items.filter(id__in=serializer.validated_data['wardrobe_item_ids'])
        return Response({
            "outfits": [
                {
                    "name": "Casual Day",
                    "items": [{"name": i.name, "category": i.category} for i in items[:3]],
                },
                {
                    "name": "Evening Out",
                    "items": [{"name": i.name, "category": i.category} for i in items[3:6]],
                },
            ]
        })


class StylingSuggestionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = AIRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({
            "tips": [
                "Pair with neutral-toned accessories for contrast.",
                "Add a structured blazer to elevate the look.",
                "Choose footwear that complements the garment silhouette.",
            ]
        })


def _product_image(product: Product) -> str | None:
    images = product.images or []
    if images:
        first = images[0]
        if isinstance(first, dict):
            return first.get("url")
        return first
    return None


def _garment_metadata(product: Product | None, override_material: str | None = None) -> dict:
    meta: dict = {"fit_type": "regular"}
    if product:
        meta["fit_type"] = product.fit_type or "regular"
        if product.material:
            meta["material"] = product.material
        # size_chart is not yet a Product field (Stage 1 note); left extensible.
        sizes = product.sizes or []
        if sizes:
            meta["size_chart"] = {s.get("label") or str(i): {} for i, s in enumerate(sizes)}
    if override_material:
        meta["material"] = override_material
    return meta


class TryOnView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        data = request.data
        person_image = data.get("person_image")
        product_id = data.get("product_id")
        garment_image = data.get("garment_image")
        material = data.get("material")
        height_cm = data.get("height_cm") or 170.0

        if not person_image:
            return Response(
                {"error": "A person photo is required.", "hint": "Upload your photo to begin."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not product_id and not garment_image:
            return Response(
                {"error": "A garment is required.", "hint": "Pick a product or upload a garment image."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        product = None
        if product_id:
            product = Product.objects.filter(id=product_id).first()
            if not product:
                return Response(
                    {"error": "Product not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

        # Resolve the garment image: explicit upload wins, else derive from product.
        if not garment_image and product:
            garment_image = _product_image(product)

        generation = Generation.objects.create(
            user=request.user,
            product=product,
            person_image=person_image,
            garment_image=garment_image or "",
            status=Generation.STATUS_PROCESSING,
        )

        try:
            # --- Pipeline: pose -> parse -> measurements -> segment -> tryon -> enhance ---
            # (detect is implicit inside tryon; we surface pose/parse for measurement quality.)
            pose_resp = run_pose(person_image)
            parse_resp = run_parse(person_image)
            measurements_resp = run_measurements(
                pose_resp.get("landmarks", []),
                height_cm,
                parse_resp.get("mask_base64") or parse_resp.get("mask_image_url"),
            )
            seg_resp = run_garment_segment(
                garment_image,
                prompt=product.name if product else None,
            )
            garment_cutout = seg_resp.get("cutout_base64") or seg_resp.get("cutout_image_url")
            if not garment_cutout:
                raise VisionEngineError("Could not isolate the garment from the image.", status=422)

            tryon_resp = run_tryon(
                person_image,
                garment_cutout,
                measurements_resp,
                _garment_metadata(product, material),
            )
            result = tryon_resp.get("result_base64") or tryon_resp.get("result_image_url")
            if not result:
                raise VisionEngineError("Try-on produced no image.", status=502)

            enhance_resp = run_enhance(result)
            final_image = enhance_resp.get("enhanced_base64") or enhance_resp.get("enhanced_image_url") or result

            fit_analysis = tryon_resp.get("fit_analysis") or {}
            generation.result_image = final_image
            generation.fit_analysis = fit_analysis
            generation.fit_confidence = tryon_resp.get("fit_confidence", 0.0)
            generation.model = tryon_resp.get("model", "")
            generation.status = Generation.STATUS_COMPLETED
            generation.save()

            return Response({
                "success": True,
                "result_image": final_image,
                "fit_analysis": fit_analysis,
                "fit_confidence": generation.fit_confidence,
                "model": generation.model,
                "generation_id": generation.id,
            })
        except VisionEngineError as exc:
            generation.status = Generation.STATUS_FAILED
            generation.error = exc.message
            generation.save()
            return Response(
                {"success": False, "error": exc.message, "hint": exc.hint},
                status=exc.status,
            )
        except Exception as exc:  # noqa: BLE001
            generation.status = Generation.STATUS_FAILED
            generation.error = str(exc)
            generation.save()
            return Response(
                {"success": False, "error": "Try-on failed unexpectedly. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class SmartSearchView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        results = []
        if q:
            products = Product.objects.filter(name__icontains=q)[:10]
            results = [
                {"id": p.id, "name": p.name, "price": str(p.price)}
                for p in products
            ]
        return Response({"results": results, "query": q})


class EditView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = AIRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({
            "result": "edit_processed",
            "edited_image_url": None,
            "message": "AI edit simulated. Connect an AI service for full processing.",
        })


class GenerateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = GenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({
            "generated": True,
            "preview_url": None,
            "description": serializer.validated_data.get("prompt", ""),
            "message": "Generation simulated. Connect an AI service for full rendering.",
        })
