from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    bio = models.TextField(blank=True)
    avatar = models.URLField(blank=True)
    is_designer = models.BooleanField(default=False)
    tagline = models.CharField(max_length=160, blank=True)
    location = models.CharField(max_length=160, blank=True)
    specialties = models.JSONField(default=list)
    phone = models.CharField(max_length=20, blank=True)
    bank_name = models.CharField(max_length=100, blank=True)
    bank_account_number = models.CharField(max_length=50, blank=True)
    bank_account_name = models.CharField(max_length=200, blank=True)


class DesignerApplication(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="designer_applications")
    brand_name = models.CharField(max_length=255)
    bio = models.TextField(blank=True)
    portfolio_links = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    rejection_reason = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="reviewed_applications"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.brand_name} ({self.user.username}) — {self.status}"


class BodyProfile(models.Model):
    SHAPE_CHOICES = [
        ("hourglass", "Hourglass"),
        ("pear", "Pear / Triangle"),
        ("apple", "Apple / Round"),
        ("rectangle", "Rectangle / Straight"),
        ("inverted_triangle", "Inverted Triangle"),
    ]

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="body_profile",
    )
    height_cm = models.DecimalField(max_digits=5, decimal_places=1)
    weight_kg = models.DecimalField(
        max_digits=5, decimal_places=1, null=True, blank=True,
    )
    body_shape = models.CharField(
        max_length=20, choices=SHAPE_CHOICES, blank=True, default="",
    )
    measurements = models.JSONField(default=dict, blank=True)
    reference_image = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"BodyProfile({self.user.username}, {self.height_cm}cm)"
