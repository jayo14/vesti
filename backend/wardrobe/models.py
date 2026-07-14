from django.db import models
from django.conf import settings

class WardrobeItem(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wardrobe_items')
    name = models.CharField(max_length=255)
    image = models.URLField(blank=True)
    category = models.CharField(max_length=100, blank=True)
    color = models.CharField(max_length=50, blank=True)
    brand = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.user.username}"
