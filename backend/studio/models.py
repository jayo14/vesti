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

    # Structured failure codes propagated from vision_engine so the admin
    # health dashboard can group failures without parsing free text.
    FAILURE_NO_PERSON = "no_person_detected"
    FAILURE_MULTIPLE_PEOPLE = "multiple_people"
    FAILURE_LOW_POSE_CONFIDENCE = "low_pose_confidence"
    FAILURE_SEGMENTATION_FAILED = "segmentation_failed"
    FAILURE_MODEL_UNAVAILABLE = "model_unavailable"
    FAILURE_MODEL_TIMEOUT = "model_timeout"
    FAILURE_PIPELINE_UNREACHABLE = "pipeline_unreachable"
    FAILURE_EMPTY_RESULT = "empty_result"
    FAILURE_UNKNOWN = "unknown"
    FAILURE_CHOICES = [
        (FAILURE_NO_PERSON, "No person detected"),
        (FAILURE_MULTIPLE_PEOPLE, "Multiple people in frame"),
        (FAILURE_LOW_POSE_CONFIDENCE, "Low pose confidence"),
        (FAILURE_SEGMENTATION_FAILED, "Garment segmentation failed"),
        (FAILURE_MODEL_UNAVAILABLE, "Model unavailable"),
        (FAILURE_MODEL_TIMEOUT, "Model timeout"),
        (FAILURE_PIPELINE_UNREACHABLE, "Vision pipeline unreachable"),
        (FAILURE_EMPTY_RESULT, "Empty result from pipeline"),
        (FAILURE_UNKNOWN, "Unknown error"),
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
    failure_reason = models.CharField(
        max_length=40, choices=FAILURE_CHOICES, blank=True, default="",
        help_text="Structured failure code from the vision pipeline (blank on success).",
    )
    latency_ms = models.IntegerField(
        default=0,
        help_text="Wall-clock duration from row creation to terminal status.",
    )
    model = models.CharField(
        max_length=60, blank=True, help_text="Which try-on backend served the request."
    )
    flagged = models.BooleanField(
        default=False, help_text="Admin flag for inappropriate or bad output."
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Generation #{self.id} - {self.user.username} - {self.status}"

