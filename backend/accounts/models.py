from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    bio = models.TextField(blank=True)
    avatar = models.URLField(blank=True)
    is_designer = models.BooleanField(default=False)
