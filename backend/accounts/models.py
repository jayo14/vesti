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
