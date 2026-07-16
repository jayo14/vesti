from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

SEED_USERS = [
    {"email": "admin@vesti.com", "username": "admin", "password": "password123", "is_staff": True, "is_superuser": True, "is_designer": True},
    {"email": "designer@vesti.com", "username": "designer", "password": "password123", "is_designer": True},
    {"email": "customer@vesti.com", "username": "customer", "password": "password123"},
]


class Command(BaseCommand):
    help = "Seed admin, designer, and customer users"

    def handle(self, *args, **options):
        for data in SEED_USERS:
            email = data.pop("email")
            username = data["username"]
            password = data.pop("password")
            user, created = User.objects.get_or_create(
                email=email,
                defaults={"username": username, **data},
            )
            if created:
                user.set_password(password)
                user.save()
                self.stdout.write(self.style.SUCCESS(f"Created user: {email}"))
            else:
                user.set_password(password)
                for k, v in data.items():
                    setattr(user, k, v)
                user.save()
                self.stdout.write(self.style.WARNING(f"Updated existing user: {email}"))
