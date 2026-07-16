from __future__ import annotations

import json
import logging
import re
from decimal import Decimal

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from products.models import Product
from studio.models import Generation
from wardrobe.models import WardrobeItem
from .openrouter import chat, chat_json
from .serializers import (
    AIRequestSerializer,
    GenerateSerializer,
    OutfitRecommendSerializer,
    StylingSuggestSerializer,
    SmartSearchSerializer,
    EditSerializer,
)
from .vision_client import VisionEngineError, enhance as run_enhance

logger = logging.getLogger("ai.views")

WEATHER_LABELS = {
    "hot": "hot (30C+)", "warm": "warm (20-30C)", "mild": "mild (10-20C)",
    "cool": "cool (5-15C)", "cold": "cold (below 5C)", "rainy": "rainy", "snowy": "snowy",
}
TIME_LABELS = {"morning": "morning", "afternoon": "afternoon", "evening": "evening", "night": "night"}
DRESS_CODE_LABELS = {
    "casual": "casual", "smart-casual": "smart-casual", "business": "business professional",
    "formal": "formal", "black-tie": "black-tie", "creative": "creative / expressive",
}


class OutfitRecommendView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = OutfitRecommendSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Fetch wardrobe items — if user is authenticated, filter by user;
        # otherwise use the explicit wardrobe_item_ids from the request.
        if request.user.is_authenticated:
            items = WardrobeItem.objects.filter(user=request.user)
            if data.get("wardrobe_item_ids"):
                items = items.filter(id__in=data["wardrobe_item_ids"])
        elif data.get("wardrobe_item_ids"):
            items = WardrobeItem.objects.filter(id__in=data["wardrobe_item_ids"])
        else:
            items = WardrobeItem.objects.none()
        if not items.exists():
            return Response(
                {"success": False, "error": "Add clothes to your wardrobe first so the AI can suggest outfits."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Build wardrobe summary for the LLM
        wardrobe_lines = []
        for i, item in enumerate(items):
            colors = item.color or "unknown"
            tags = getattr(item, "category", "") or "unknown"
            seasons = ""
            wardrobe_lines.append(
                f"{i+1}. [ID:{item.id}] {item.name} ({item.category}) "
                f"-- colors: {colors}, style: {tags}, seasons: {seasons}"
            )
        wardrobe_summary = "\n".join(wardrobe_lines)

        # Fetch marketplace products for gap-fill suggestions
        marketplace_products = Product.objects.filter(is_published=True)[:16]
        mp_lines = []
        for p in marketplace_products:
            colors = ", ".join(c.get("name", "") for c in (p.colors or []) if isinstance(c, dict))
            tags = ", ".join(p.tags or [])
            mp_lines.append(
                f"[ID:{p.id}] {p.name} -- {p.price} {p.currency}, "
                f"category: {p.category.slug if p.category else ''}, "
                f"colors: {colors}, tags: {tags}"
            )
        marketplace_summary = "\n".join(mp_lines)

        occasion = data.get("occasion", "")
        weather = data.get("weather", "mild")
        time_of_day = data.get("timeOfDay", "afternoon")
        dress_code = data.get("dressCode", "smart-casual")

        system_prompt = f"""You are an expert personal stylist. The user has asked for outfit recommendations.

Their wardrobe:
{wardrobe_summary}

Available marketplace products (for gap-filling suggestions only):
{marketplace_summary}

Context for the outfit:
- Occasion: {occasion}
- Weather: {WEATHER_LABELS.get(weather, weather)}
- Time of day: {TIME_LABELS.get(time_of_day, time_of_day)}
- Dress code: {DRESS_CODE_LABELS.get(dress_code, dress_code)}

Recommend 2-3 complete outfits using items FROM THE USER'S WARDROBE. For each outfit:
1. Combine wardrobe items that work together (use the ID format like "ID:123")
2. If the wardrobe is missing a key piece for the occasion, suggest 1-2 marketplace products to fill the gap
3. Provide styling tips

Return ONLY a JSON array of 2-3 outfit objects:
[
  {{
    "title": "short catchy title",
    "rationale": "1-2 sentences explaining why this works",
    "wardrobeItemIds": ["ID:1", "ID:2"],
    "marketplaceSuggestions": [
      {{"productId": "ID:5", "reason": "why this filler piece completes the look"}}
    ],
    "stylingTips": ["practical tip 1", "practical tip 2"]
  }}
]

Rules:
- Prefer wardrobe items over marketplace suggestions.
- Each outfit must use at least 2 wardrobe items.
- Match colors, dress code, and weather.
- Use real wardrobe item IDs from the list.
- Use real marketplace product IDs if suggesting fillers.
- Return ONLY the JSON array, no other text."""

        try:
            raw = chat([
                {"role": "assistant", "content": system_prompt},
                {"role": "user", "content": f"Suggest 2-3 outfits for: {occasion}"},
            ])
            outfits = self._parse_outfits(raw, items, marketplace_products)
        except RuntimeError as exc:
            return Response(
                {"success": False, "error": str(exc)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        if not outfits:
            return Response(
                {"success": False, "error": "Could not generate outfit suggestions. Try again."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response({"success": True, "outfits": outfits})

    def _parse_outfits(self, raw: str, wardrobe_items, marketplace_products):
        valid_wardrobe_ids = {str(i.id) for i in wardrobe_items}
        valid_product_ids = {str(p.id) for p in marketplace_products}

        raw_outfits = []
        try:
            raw_outfits = json.loads(raw)
        except json.JSONDecodeError:
            match = re.search(r"\[[\s\S]*\]", raw)
            if match:
                try:
                    raw_outfits = json.loads(match.group(0))
                except json.JSONDecodeError:
                    return []
        if not isinstance(raw_outfits, list):
            return []

        outfits = []
        for o in raw_outfits[:3]:
            if not isinstance(o, dict):
                continue
            raw_ids = o.get("wardrobeItemIds", [])
            if isinstance(raw_ids, list):
                wardrobe_ids = [
                    re.sub(r"^ID:?", "", str(rid)).strip()
                    for rid in raw_ids
                    if re.sub(r"^ID:?", "", str(rid)).strip() in valid_wardrobe_ids
                ]
            else:
                wardrobe_ids = []

            raw_sugs = o.get("marketplaceSuggestions", [])
            if isinstance(raw_sugs, list):
                marketplace_suggestions = []
                for s in raw_sugs:
                    pid = re.sub(r"^ID:?", "", str(s.get("productId", ""))).strip()
                    if pid in valid_product_ids:
                        marketplace_suggestions.append({
                            "productId": pid,
                            "reason": str(s.get("reason", ""))[:200],
                        })
            else:
                marketplace_suggestions = []

            styling_tips = o.get("stylingTips", [])
            if not isinstance(styling_tips, list):
                styling_tips = []

            outfits.append({
                "title": str(o.get("title", ""))[:80],
                "rationale": str(o.get("rationale", ""))[:400],
                "wardrobeItemIds": wardrobe_ids,
                "marketplaceSuggestions": marketplace_suggestions,
                "stylingTips": [str(t)[:200] for t in styling_tips[:5]],
            })

        return [o for o in outfits if o["wardrobeItemIds"]]


class StylingSuggestionsView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = StylingSuggestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        product_id = data.get("productId")
        product = None
        if product_id and product_id.isdigit():
            product = Product.objects.filter(id=int(product_id)).first()

        product_name = data.get("productName", product.name if product else "this garment")
        product_image = data.get("productImage", "")
        product_desc = data.get("productDescription", product.description if product else "")

        material_hint = ""
        if product and product.material:
            material_hint = f" Material: {product.material}."
        category_hint = ""
        if product and product.category:
            category_hint = f" Category: {product.category.name}."
        fit_hint = ""
        if product and product.fit_type:
            fit_hint = f" Fit: {product.fit_type}."

        system_prompt = f"""You are an expert fashion stylist. Look at this garment: {product_name} - {product_desc}.
{material_hint}{category_hint}{fit_hint}

Propose 3 different styling ideas for different occasions.

Return a JSON array of 3 objects, each with:
- "title": short name (e.g. "Sunday brunch")
- "occasion": the occasion it's styled for
- "description": 1-2 sentences describing the full look
- "pairing": array of 3-4 pairing pieces

Return ONLY the JSON array."""

        try:
            raw = chat([
                {"role": "assistant", "content": system_prompt},
                {"role": "user", "content": f"Suggest 3 ways to wear {product_name}"},
            ])
            suggestions = self._parse_suggestions(raw)
        except RuntimeError as exc:
            return Response(
                {"success": False, "error": str(exc)},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        if not suggestions:
            suggestions = [
                {"title": f"Casual {product_name}", "occasion": "Everyday wear",
                 "description": f"Style {product_name} with neutral basics for a relaxed look.",
                 "pairing": ["Simple accessories", "Comfortable footwear", "Minimal jewelry"]},
                {"title": f"Dressed-up {product_name}", "occasion": "Evening out",
                 "description": f"Elevate {product_name} with statement pieces.",
                 "pairing": ["Heeled shoes", "Statement earrings", "Clutch bag"]},
                {"title": f"Layered {product_name}", "occasion": "Transitional weather",
                 "description": f"Layer {product_name} thoughtfully for dimension.",
                 "pairing": ["Light jacket", "Scarf", "Ankle boots"]},
            ]

        return Response({"success": True, "suggestions": suggestions})

    def _parse_suggestions(self, raw: str) -> list:
        try:
            items = json.loads(raw)
        except json.JSONDecodeError:
            match = re.search(r"\[[\s\S]*\]", raw)
            if match:
                try:
                    items = json.loads(match.group(0))
                except (json.JSONDecodeError, TypeError):
                    return []
            else:
                return []
        if not isinstance(items, list):
            return []
        result = []
        stamp = __import__("time").time()
        for i, s in enumerate(items[:3]):
            if not isinstance(s, dict):
                continue
            result.append({
                "id": f"styling-{int(stamp)}-{i}",
                "title": str(s.get("title", f"Look {i+1}"))[:60],
                "description": str(s.get("description", ""))[:400],
                "occasion": str(s.get("occasion", ""))[:80],
                "pairing": [str(p)[:80] for p in (s.get("pairing", []) or [])[:5]],
            })
        return result


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
            try:
                product = Product.objects.get(id=product_id)
            except Product.DoesNotExist:
                return Response(
                    {"error": "Product not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

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
            from .vision_client import (
                tryon as run_tryon,
                pose as run_pose,
                parse as run_parse,
                measurements as run_measurements,
                garment_segment as run_garment_segment,
            )

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
        except Exception as exc:
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
        """Backward-compatible GET with basic icontains search."""
        q = request.query_params.get('q', '').strip()
        results = []
        if q:
            from django.db.models import Q
            products = Product.objects.filter(
                Q(name__icontains=q) | Q(description__icontains=q)
            ).filter(is_published=True)[:10]
            results = [
                {"id": p.id, "name": p.name, "price": str(p.price)}
                for p in products
            ]
        return Response({"results": results, "query": q})

    def post(self, request):
        serializer = SmartSearchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        query = serializer.validated_data["query"]

        if not query.strip():
            return Response(
                {"success": False, "error": "Please provide a search query."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Step 1: LLM query-rewrite to extract structured filters
        parsed = self._parse_query(query)
        filters = parsed.get("filters", {})
        interpretation = parsed.get("interpretation", "")
        summary = parsed.get("summary", "")

        # Step 2: icontains fallback — search products by name/description/tags
        products = Product.objects.filter(is_published=True)

        keyword_search = query.strip()
        if filters.get("keywords"):
            keyword_search = " ".join(filters["keywords"])

        name_matches = products.filter(name__icontains=keyword_search)
        desc_matches = products.filter(description__icontains=keyword_search)
        tag_matches = products.filter(tags__icontains=keyword_search)

        from django.db.models import Q
        combined = products.filter(
            Q(name__icontains=keyword_search) |
            Q(description__icontains=keyword_search) |
            Q(tags__icontains=keyword_search)
        ).distinct()[:20]

        # Filter by category if specified
        category_filter = filters.get("category")
        if category_filter and category_filter != "all":
            from products.models import Category
            cat = Category.objects.filter(slug__iexact=category_filter).first()
            if cat:
                combined = combined.filter(category=cat)

        # Step 3: Build structured matches
        matches = []
        for p in combined:
            score = 50
            matched_on = []
            reason_parts = []

            # Category boost
            if category_filter and category_filter != "all":
                cat_slug = p.category.slug if p.category else ""
                if cat_slug == category_filter:
                    score += 30
                    matched_on.append("category")
                    reason_parts.append(f"matches {category_filter}")

            # Keyword match
            kw_list = filters.get("keywords", [])
            for kw in kw_list:
                kw_lower = kw.lower()
                haystack = f"{p.name} {p.description} {' '.join(p.tags or [])}".lower()
                if kw_lower in haystack:
                    score += 15
                    matched_on.append(f"keyword:{kw}")

            # Price constraint
            max_price = filters.get("maxPrice")
            if max_price is not None:
                try:
                    if float(p.price) <= float(max_price):
                        score += 10
                        matched_on.append("within-budget")
                        reason_parts.append("within your budget")
                except (ValueError, TypeError):
                    pass

            # Color match
            colors_wanted = filters.get("colors", [])
            if colors_wanted:
                product_colors = [
                    c.get("name", "").lower() for c in (p.colors or []) if isinstance(c, dict)
                ]
                for cw in colors_wanted:
                    if any(cw.lower() in pc for pc in product_colors):
                        score += 20
                        matched_on.append(f"color:{cw}")

            if score > 0 and len(matches) < 10:
                reason = reason_parts[0] if reason_parts else "matches your search"
                matches.append({
                    "productId": str(p.id),
                    "score": min(100, score),
                    "reason": reason[0].upper() + reason[1:] if reason else "Matches your search",
                    "matchedOn": matched_on,
                })

        matches.sort(key=lambda m: m["score"], reverse=True)

        if not summary:
            if not matches:
                summary = "I couldn't find products matching that. Try rephrasing or browse the full marketplace."
            else:
                summary = f"I found {len(matches)} product{'s' if len(matches) != 1 else ''} that match your needs."

        return Response({
            "success": True,
            "interpretation": interpretation,
            "filters": filters,
            "matches": matches,
            "summary": summary,
        })

    def _parse_query(self, query: str) -> dict:
        system_prompt = f"""You are an AI fashion stylist. Parse this search query and return JSON:
{{
  "interpretation": "one-sentence restatement",
  "filters": {{
    "occasion": string or null,
    "maxPrice": number or null,
    "minPrice": number or null,
    "currency": "USD" | "NGN" | "EUR" | "GBP",
    "category": "dresses" | "tops" | "outerwear" | "bottoms" | "knitwear" | "accessories" | null,
    "colors": [string] or [],
    "sizes": [string] or [],
    "audienceHint": string or null,
    "genderHint": "male" | "female" | "unisex" | null,
    "keywords": [string] or []
  }},
  "summary": "1-2 sentence friendly intro"
}}

Detect currency from symbols (₦=NGN, $=USD, €=EUR, £=GBP).
"Classy", "elegant", "formal" go to keywords.
"Office wear" → keywords ["office"], occasion "office".
"Wedding" → occasion "wedding".
"Pink dresses" → colors ["pink"], category "dresses".
Return ONLY the JSON."""

        try:
            return chat_json([
                {"role": "assistant", "content": system_prompt},
                {"role": "user", "content": query},
            ])
        except RuntimeError:
            return {}


class EditView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = EditSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        image = data.get("image", "")
        if not image:
            return Response(
                {"success": False, "error": "An image is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            enhance_resp = run_enhance(image, scale=2)
            result_image = enhance_resp.get("enhanced_base64") or enhance_resp.get("enhanced_image_url")
            if not result_image:
                raise VisionEngineError("Enhancement produced no output.", status=502)

            return Response({
                "success": True,
                "resultImage": result_image,
            })
        except VisionEngineError as exc:
            return Response(
                {"success": False, "error": exc.message, "hint": exc.hint},
                status=exc.status,
            )
        except Exception:
            logger.exception("Edit failed")
            return Response(
                {"success": False, "error": "Image editing failed. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class GenerateView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = GenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            prompt = data.get("prompt", "")
            garment_type = data.get("garment_type", "")
            colour = data.get("colour", "")
            material = data.get("material", "")

            enhance_prompt = f"{colour} {material} {garment_type} {prompt}".strip()
            if not enhance_prompt:
                enhance_prompt = prompt

            enhance_resp = run_enhance("", scale=2)
            result_image = enhance_resp.get("enhanced_base64") or enhance_resp.get("enhanced_image_url", "")

            return Response({
                "success": bool(result_image),
                "preview_url": result_image or None,
                "description": enhance_prompt,
            })
        except VisionEngineError as exc:
            return Response(
                {"success": False, "error": exc.message},
                status=exc.status,
            )
        except Exception as exc:
            logger.exception("Generate failed")
            return Response(
                {"success": False, "error": "Generation failed unexpectedly."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
