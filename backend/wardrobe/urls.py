from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WardrobeItemViewSet

router = DefaultRouter()
router.register('wardrobe', WardrobeItemViewSet, basename='wardrobe')

urlpatterns = [
    path('', include(router.urls)),
]
