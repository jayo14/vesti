from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from .models import Product, Category
from .serializers import ProductListSerializer, ProductDetailSerializer, ProductCreateSerializer, CategorySerializer
from accounts.permissions import IsDesigner

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "description", "category__name"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ProductDetailSerializer
        if self.action == "create":
            return ProductCreateSerializer
        if self.action == "update" or self.action == "partial_update":
            return ProductCreateSerializer
        return ProductListSerializer

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [permissions.IsAuthenticated(), IsDesigner()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        serializer.save(designer=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated, IsDesigner])
    def submit(self, request, pk=None):
        try:
            product = Product.objects.get(pk=pk, designer=request.user)
        except Product.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        if product.moderation_status not in ("draft", "rejected"):
            return Response(
                {"detail": f"Product is {product.moderation_status}; cannot resubmit."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        product.moderation_status = "pending_review"
        product.rejection_reason = ""
        product.save(update_fields=["moderation_status", "rejection_reason", "updated_at"])
        return Response({
            "id": product.id,
            "moderation_status": product.moderation_status,
        })

    def get_queryset(self):
        qs = Product.objects.all()
        if self.action in ("update", "partial_update", "destroy") and not self.request.user.is_staff:
            qs = qs.filter(designer=self.request.user)
        if self.action == "list" and not self.request.user.is_staff:
            if self.request.user.is_authenticated:
                qs = qs.filter(
                    Q(moderation_status="published") |
                    Q(designer=self.request.user)
                )
            else:
                qs = qs.filter(moderation_status="published")
        designer_id = self.request.query_params.get("designer")
        if designer_id:
            qs = qs.filter(designer_id=designer_id)
        category = self.request.query_params.get("category")
        if category:
            qs = qs.filter(category__slug=category)
        min_price = self.request.query_params.get("min_price")
        max_price = self.request.query_params.get("max_price")
        if min_price:
            qs = qs.filter(price__gte=min_price)
        if max_price:
            qs = qs.filter(price__lte=max_price)
        sort = self.request.query_params.get("sort")
        if sort == "price_asc":
            qs = qs.order_by("price")
        elif sort == "price_desc":
            qs = qs.order_by("-price")
        elif sort == "newest":
            qs = qs.order_by("-created_at")
        return qs


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]


class MyProductsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsDesigner]

    def get(self, request):
        products = Product.objects.filter(designer=request.user).select_related("category")
        return Response([
            {
                'id': p.id,
                'name': p.name,
                'price': str(p.price),
                'stock': p.stock,
                'category': p.category.name if p.category else None,
                'image_url': p.images[0] if p.images else None,
                'is_published': p.is_published,
                'moderation_status': p.moderation_status,
                'rejection_reason': p.rejection_reason,
                'material': p.material,
                'fit_type': p.fit_type,
                'created_at': p.created_at,
            }
            for p in products
        ])


class DesignerListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        designers = (
            Product.objects.values_list("designer", flat=True).distinct()
        )
        from django.contrib.auth import get_user_model
        User = get_user_model()
        # Annotate collection counts via the related products
        users = User.objects.filter(id__in=[d for d in designers if d]).filter(is_designer=True)
        data = []
        for u in users:
            products = u.products.all()
            collection_count = products.count()
            rated = products.exclude(rating=0)
            avg_rating = round(sum(p.rating for p in rated) / rated.count(), 2) if rated.exists() else 0.0
            data.append({
                "id": u.id,
                "username": u.username,
                "bio": u.bio,
                "avatar": u.avatar,
                "is_designer": u.is_designer,
                "collection_count": collection_count,
                "rating": avg_rating,
                "product_count": collection_count,
                "specialties": [],
            })
        return Response(data)


class DesignerDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, id):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            u = User.objects.get(id=id, is_designer=True)
        except User.DoesNotExist:
            return Response({"detail": "Designer not found"}, status=404)
        products = u.products.all()
        rated = products.exclude(rating=0)
        avg_rating = round(sum(p.rating for p in rated) / rated.count(), 2) if rated.exists() else 0.0
        return Response({
            "id": u.id,
            "username": u.username,
            "bio": u.bio,
            "avatar": u.avatar,
            "is_designer": u.is_designer,
            "collection_count": products.count(),
            "rating": avg_rating,
            "product_count": products.count(),
            "specialties": [],
        })


class OptionsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from .models import MATERIAL_CHOICES, FIT_TYPE_CHOICES
        return Response({
            "materials": [{"value": k, "label": v} for k, v in MATERIAL_CHOICES],
            "colours": ["Black", "White", "Red", "Blue", "Green", "Beige", "Navy", "Grey", "Pink", "Purple"],
            "fits": [{"value": k, "label": v} for k, v in FIT_TYPE_CHOICES],
            "sizes": ["XS", "S", "M", "L", "XL", "XXL"],
        })


class AdminProductModerationListView(APIView):
    """Admin queue of products awaiting review.

    Accepts ``?status=pending_review|draft|published|rejected|all`` (defaults to
    pending_review). Returns enough shape for the queue UI without dragging the
    full detail serializer in.
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        status_filter = request.query_params.get("status", "pending_review")
        qs = Product.objects.select_related("category", "designer").all()
        if status_filter != "all":
            qs = qs.filter(moderation_status=status_filter)
        return Response([
            {
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "price": str(p.price),
                "currency": p.currency,
                "images": p.images,
                "image_url": (p.images[0] if p.images else None),
                "designer_id": p.designer_id,
                "designer_name": p.designer.username if p.designer else None,
                "category": p.category.name if p.category else None,
                "material": p.material,
                "fit_type": p.fit_type,
                "sizes": p.sizes,
                "colors": p.colors,
                "moderation_status": p.moderation_status,
                "rejection_reason": p.rejection_reason,
                "is_published": p.is_published,
                "created_at": p.created_at,
                "updated_at": p.updated_at,
            }
            for p in qs
        ])


class AdminProductModerationReviewView(APIView):
    """Approve or reject a product. Approval flips is_published to True.

    Body: ``{"action": "approve"}`` or
    ``{"action": "reject", "rejection_reason": "..."}``.
    """
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        try:
            product = Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get("action")
        if action == "approve":
            product.moderation_status = "published"
            product.is_published = True
            product.rejection_reason = ""
            product.save(update_fields=[
                "moderation_status", "is_published", "rejection_reason", "updated_at",
            ])
            return Response({"id": product.id, "moderation_status": product.moderation_status,
                             "is_published": product.is_published})
        if action == "reject":
            reason = request.data.get("rejection_reason", "").strip()
            if not reason:
                return Response(
                    {"detail": "A rejection reason is required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            product.moderation_status = "rejected"
            product.is_published = False
            product.rejection_reason = reason
            product.save(update_fields=[
                "moderation_status", "is_published", "rejection_reason", "updated_at",
            ])
            return Response({"id": product.id, "moderation_status": product.moderation_status,
                             "rejection_reason": product.rejection_reason})
        return Response(
            {"detail": "Invalid action. Use 'approve' or 'reject'."},
            status=status.HTTP_400_BAD_REQUEST,
        )
