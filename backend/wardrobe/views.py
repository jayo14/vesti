from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count
from .models import WardrobeItem
from .serializers import WardrobeItemSerializer

class WardrobeItemViewSet(viewsets.ModelViewSet):
    serializer_class = WardrobeItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = WardrobeItem.objects.filter(user=self.request.user)
        category = self.request.query_params.get("category")
        if category:
            qs = qs.filter(category__iexact=category)
        return qs

class WardrobeAnalyzeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        items = WardrobeItem.objects.filter(user=request.user)
        total = items.count()
        categories = items.values("category").annotate(count=Count("id")).order_by("-count")
        return Response({
            "total_items": total,
            "categories": {c["category"] or "Uncategorized": c["count"] for c in categories},
            "top_categories": [c["category"] for c in categories[:3] if c["category"]],
        })
