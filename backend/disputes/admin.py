from django.contrib import admin
from .models import Dispute


@admin.register(Dispute)
class DisputeAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "user", "reason", "status", "created_at")
    list_filter = ("status", "reason")
    search_fields = ("order__id", "user__username", "user__email")
