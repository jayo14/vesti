from rest_framework import viewsets, permissions, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from .models import Product, Category
from .serializers import ProductSerializer, CategorySerializer

class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "description", "category__name"]

    def get_queryset(self):
        qs = Product.objects.all()
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

class OptionsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({
            "materials": ["Cotton", "Silk", "Denim", "Leather", "Linen", "Wool", "Polyester", "Velvet", "Cashmere"],
            "colours": ["Black", "White", "Red", "Blue", "Green", "Beige", "Navy", "Grey", "Pink", "Purple"],
            "fits": ["Slim", "Regular", "Oversized"],
            "sizes": ["XS", "S", "M", "L", "XL", "XXL"],
        })
