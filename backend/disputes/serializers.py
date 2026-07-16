from rest_framework import serializers
from .models import Dispute


class DisputeSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source="user.username", read_only=True)
    order_status = serializers.CharField(source="order.status", read_only=True)
    order_total = serializers.DecimalField(
        source="order.total", read_only=True, max_digits=10, decimal_places=2
    )
    resolved_by_username = serializers.CharField(
        source="resolved_by.username", read_only=True, default=None
    )

    class Meta:
        model = Dispute
        fields = [
            "id", "order", "order_status", "order_total",
            "user", "user_username", "reason", "description",
            "status", "resolution_notes",
            "resolved_by", "resolved_by_username", "resolved_at",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "user", "status", "resolution_notes",
            "resolved_by", "resolved_at", "created_at", "updated_at",
        ]


class DisputeCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dispute
        fields = ["order", "reason", "description"]


class DisputeResolveSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=["resolve", "reject", "start_review"])
    resolution_notes = serializers.CharField(required=False, allow_blank=True)
