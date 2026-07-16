from django.urls import path
from .views import (
    DisputeListCreateView,
    AdminDisputeListView,
    AdminDisputeDetailView,
    AdminDisputeResolveView,
)

urlpatterns = [
    path('disputes/', DisputeListCreateView.as_view(), name='disputes-list-create'),
    path('admin/disputes/', AdminDisputeListView.as_view(), name='admin-disputes'),
    path('admin/disputes/<int:pk>/', AdminDisputeDetailView.as_view(), name='admin-dispute-detail'),
    path('admin/disputes/<int:dispute_id>/resolve/',
         AdminDisputeResolveView.as_view(), name='admin-dispute-resolve'),
]
