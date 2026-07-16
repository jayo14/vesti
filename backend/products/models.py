from django.db import models
from django.conf import settings

MATERIAL_CHOICES = [
    ("ankara", "Ankara"),
    ("lace", "Lace"),
    ("silk", "Silk"),
    ("cotton", "Cotton"),
    ("denim", "Denim"),
    ("linen", "Linen"),
    ("velvet", "Velvet"),
    ("chiffon", "Chiffon"),
]

FIT_TYPE_CHOICES = [
    ("slim", "Slim"),
    ("regular", "Regular"),
    ("oversized", "Oversized"),
]


class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)

    class Meta:
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.name


class Product(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    designer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default="NGN")
    images = models.JSONField(default=list)
    sizes = models.JSONField(default=list)
    colors = models.JSONField(default=list)
    tags = models.JSONField(default=list)
    stock = models.IntegerField(default=0)
    stock_count = models.IntegerField(default=0)
    material = models.CharField(max_length=20, choices=MATERIAL_CHOICES, blank=True)
    fit_type = models.CharField(max_length=20, choices=FIT_TYPE_CHOICES, default="regular")
    rating = models.FloatField(default=0.0)
    featured = models.BooleanField(default=False)
    ships_from = models.CharField(max_length=120, blank=True)
    ships_within = models.CharField(max_length=120, blank=True)
    returns = models.CharField(max_length=120, blank=True)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

