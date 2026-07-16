from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from orders.models import Order
from .models import Dispute
from .serializers import (
    DisputeSerializer, DisputeCreateSerializer, DisputeResolveSerializer,
)


class DisputeListCreateView(generics.ListCreateAPIView):
    """Users see their own disputes; can raise one on an order they own."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DisputeSerializer

    def get_queryset(self):
        return Dispute.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return DisputeCreateSerializer
        return DisputeSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.validated_data["order"]
        if order.user_id != request.user.id:
            return Response(
                {"detail": "You can only raise a dispute on your own order."},
                status=status.HTTP_403_FORBIDDEN,
            )
        dispute = Dispute.objects.create(user=request.user, **serializer.validated_data)
        return Response(DisputeSerializer(dispute).data, status=status.HTTP_201_CREATED)


class AdminDisputeListView(generics.ListAPIView):
    queryset = Dispute.objects.select_related("order", "user", "resolved_by").all()
    serializer_class = DisputeSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        qs = super().get_queryset()
        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class AdminDisputeDetailView(generics.RetrieveAPIView):
    queryset = Dispute.objects.select_related("order", "user", "resolved_by").all()
    serializer_class = DisputeSerializer
    permission_classes = [permissions.IsAdminUser]


class AdminDisputeResolveView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, dispute_id):
        try:
            dispute = Dispute.objects.get(pk=dispute_id)
        except Dispute.DoesNotExist:
            return Response({"detail": "Dispute not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = DisputeResolveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        action = serializer.validated_data["action"]
        notes = serializer.validated_data.get("resolution_notes", "")

        if action == "start_review":
            dispute.status = Dispute.STATUS_IN_REVIEW
        elif action == "resolve":
            dispute.status = Dispute.STATUS_RESOLVED
            dispute.resolution_notes = notes
            dispute.resolved_by = request.user
            dispute.resolved_at = timezone.now()
        elif action == "reject":
            dispute.status = Dispute.STATUS_REJECTED
            dispute.resolution_notes = notes
            dispute.resolved_by = request.user
            dispute.resolved_at = timezone.now()

        dispute.save()
        return Response(DisputeSerializer(dispute).data)
