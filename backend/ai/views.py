from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from wardrobe.models import WardrobeItem
from products.models import Product
from .serializers import AIRequestSerializer, GenerateSerializer

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

class TryOnView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = AIRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({
            "result": "try_on_processed",
            "preview_url": None,
            "message": "Virtual try-on simulated. Connect an AI service for full rendering.",
        })

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
