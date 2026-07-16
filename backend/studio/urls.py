from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProjectViewSet,
    AdminGenerationListView,
    AdminGenerationFlagView,
)

router = DefaultRouter()
router.register('studio', ProjectViewSet, basename='project')

urlpatterns = [
    path('', include(router.urls)),
    path('admin/generations/', AdminGenerationListView.as_view(),
         name='admin-generations'),
    path('admin/generations/<int:pk>/flag/',
         AdminGenerationFlagView.as_view(), name='admin-generation-flag'),
]
