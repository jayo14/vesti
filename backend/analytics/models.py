from django.db import models
from django.conf import settings


class Event(models.Model):
    CATEGORY_CHOICES = [
        ("auth", "Auth"),
        ("studio", "Studio / Try-On"),
        ("marketplace", "Marketplace"),
        ("orders", "Orders / Checkout"),
        ("wardrobe", "Wardrobe"),
        ("ai", "AI Feature"),
        ("admin", "Admin"),
        ("payment", "Payment"),
        ("other", "Other"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    category = models.CharField(max_length=32, choices=CATEGORY_CHOICES, db_index=True)
    name = models.CharField(max_length=128, db_index=True)
    data = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, default="")
    session_key = models.CharField(max_length=64, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "analytics_event"
        indexes = [
            models.Index(fields=["category", "created_at"]),
            models.Index(fields=["name", "created_at"]),
        ]

    def __str__(self):
        return f"[{self.category}] {self.name} @ {self.created_at}"
