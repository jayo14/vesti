"""Seed the marketplace from fixtures ported from the frontend mock data.

Usage:
    python manage.py seed_marketplace          # create designers + categories + products
    python manage.py seed_marketplace --clear  # wipe existing seeded rows first

The old string designer ids ("d1".."d4") are mapped to freshly created
``accounts.User`` rows (is_designer=True). Image URLs are kept as-is
(Unsplash) — real designer uploads arrive in a later stage.
"""
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.conf import settings

from products.models import Product, Category

import os
import json

# fixtures live in products/fixtures (two levels up from .../management/commands)
FIXTURE_DIR = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "..", "fixtures")
)


def _load(name):
    with open(os.path.join(FIXTURE_DIR, name), "r", encoding="utf-8") as fh:
        return json.load(fh)


class Command(BaseCommand):
    help = "Seed designers, categories and products from mock fixtures."

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete previously seeded designers and products first.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        User = get_user_model()
        designers = _load("designers.json")
        products = _load("products.json")

        if options["clear"]:
            self.stdout.write("Clearing existing seed data...")
            # Remove designers whose username matches the seeded set.
            seeded_usernames = [d["name"] for d in designers]
            User.objects.filter(username__in=seeded_usernames).delete()
            Product.objects.all().delete()

        # --- Designers -------------------------------------------------
        # Map old string id -> real User instance.
        designer_map = {}
        for d in designers:
            user, created = User.objects.get_or_create(
                username=d["name"],
                defaults={
                    "is_designer": True,
                    "bio": d.get("bio", ""),
                    "tagline": d.get("tagline", ""),
                    "avatar": d.get("avatar", ""),
                    "location": d.get("location", ""),
                    "specialties": d.get("specialties", []),
                },
            )
            if not created:
                user.is_designer = True
                user.bio = d.get("bio", user.bio)
                user.tagline = d.get("tagline", user.tagline)
                user.avatar = d.get("avatar", user.avatar)
                user.location = d.get("location", user.location)
                user.specialties = d.get("specialties", user.specialties)
                user.save()
            designer_map[d["id"]] = user
            self.stdout.write(f"  designer: {user.username} ({'new' if created else 'updated'})")

        # --- Categories -------------------------------------------------
        category_map = {}
        needed_categories = sorted({p["category"] for p in products})
        for slug in needed_categories:
            cat, _ = Category.objects.get_or_create(
                slug=slug, defaults={"name": slug.title()}
            )
            category_map[slug] = cat
        self.stdout.write(f"  categories: {len(category_map)}")

        # --- Products ---------------------------------------------------
        created_count = 0
        for p in products:
            designer = designer_map.get(p.get("sellerId"))
            category = category_map.get(p["category"])
            if not category:
                self.stderr.write(f"  skipping {p['name']}: unknown category {p['category']}")
                continue

            availability = p.get("availability", "in-stock")
            base_stock = p.get("stockCount", 0)
            # Derive total stock + per-size stock from availability.
            if availability == "sold-out":
                total_stock = 0
            else:
                total_stock = max(base_stock, 1)

            obj, created = Product.objects.update_or_create(
                name=p["name"],
                designer=designer,
                defaults={
                    "category": category,
                    "description": p.get("description", ""),
                    "price": p["price"],
                    "currency": "NGN",
                    "images": p.get("images", []),
                    "colors": p.get("colors", []),
                    "sizes": p.get("sizes", []),
                    "tags": p.get("tags", []),
                    "stock": total_stock,
                    "stock_count": base_stock,
                    "rating": p.get("rating", 0.0),
                    "featured": p.get("featured", False),
                    "material": p.get("material", ""),
                    "fit_type": "regular",
                    "ships_from": p.get("shipsFrom", ""),
                    "ships_within": p.get("shipsWithin", ""),
                    "returns": p.get("returns", ""),
                    "is_published": True,
                },
            )
            if created:
                created_count += 1
            self.stdout.write(f"  product: {obj.name} ({'new' if created else 'updated'})")

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {len(designer_map)} designers, "
                f"{len(category_map)} categories, {created_count} new products "
                f"({len(products)} total)."
            )
        )
