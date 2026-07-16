from rest_framework import viewsets, permissions, filters
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

    def get_serializer_class(self):
        if self.action == "create":
            return ProductCreateSerializer
        if self.action == "retrieve":
            return ProductDetailSerializer
        return ProductListSerializer

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [permissions.IsAuthenticated(), IsDesigner()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        serializer.save(designer=self.request.user)

    def get_queryset(self):
        qs = Product.objects.all()
        if self.action in ("update", "partial_update", "destroy") and not self.request.user.is_staff:
            qs = qs.filter(designer=self.request.user)
        if self.action == "list" and not self.request.user.is_staff:
            qs = qs.filter(Q(is_published=True) | Q(designer=self.request.user))
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
        products = Product.objects.filter(designer=request.user)
        return Response([
            {
                'id': p.id,
                'name': p.name,
                'price': str(p.price),
                'stock': p.stock,
                'category': p.category.name if p.category else None,
                'image_url': p.images[0] if p.images else None,
                'is_published': p.is_published,
                'created_at': p.created_at,
            }
            for p in products
        ])


class OptionsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({
            "materials": ["Cotton", "Silk", "Denim", "Leather", "Linen", "Wool", "Polyester", "Velvet", "Cashmere"],
            "colours": ["Black", "White", "Red", "Blue", "Green", "Beige", "Navy", "Grey", "Pink", "Purple"],
            "fits": ["Slim", "Regular", "Oversized"],
            "sizes": ["XS", "S", "M", "L", "XL", "XXL"],
        })
