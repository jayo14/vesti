from django.db import models
from django.conf import settings

class Project(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='studio_projects')
    name = models.CharField(max_length=255)
    garment_data = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.name} - {self.user.username}"


class Generation(models.Model):
    """A single virtual try-on generation performed by the vision_engine pipeline.

    Powers the designer "try-on -> purchase" conversion metric and the admin
    AI-health dashboard. Stores the source person image, the garment/product
    reference, the resulting image, and the structured Fit Analysis object.
    """

    STATUS_PENDING = "pending"
    STATUS_PROCESSING = "processing"
    STATUS_COMPLETED = "completed"
    STATUS_FAILED = "failed"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_PROCESSING, "Processing"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_FAILED, "Failed"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="generations"
    )
    product = models.ForeignKey(
        "products.Product",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="generations",
    )
    person_image = models.TextField(help_text="Stored image URL or base64 data URL.")
    garment_image = models.TextField(
        blank=True, help_text="Explicit garment cutout URL/data URL if not derived from a product."
    )
    result_image = models.TextField(blank=True, help_text="Result image URL or base64 data URL.")
    fit_analysis = models.JSONField(
        default=dict, blank=True, help_text="Structured Fit Analysis object from vision_engine."
    )
    fit_confidence = models.FloatField(default=0.0)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING
    )
    error = models.TextField(blank=True)
    model = models.CharField(
        max_length=60, blank=True, help_text="Which try-on backend served the request."
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Generation #{self.id} - {self.user.username} - {self.status}"

