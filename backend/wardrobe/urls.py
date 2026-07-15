from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WardrobeItemViewSet, WardrobeAnalyzeView

router = DefaultRouter()
router.register('wardrobe', WardrobeItemViewSet, basename='wardrobe')

urlpatterns = [
    path('', include(router.urls)),
    path('wardrobe/analyze/', WardrobeAnalyzeView.as_view(), name='wardrobe-analyze'),
]
