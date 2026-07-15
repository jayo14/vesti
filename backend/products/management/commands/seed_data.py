from django.core.management.base import BaseCommand
from products.models import Category, Product
from accounts.models import User


class Command(BaseCommand):
    help = "Seed the database with sample data"

    def handle(self, *args, **options):
        user, _ = User.objects.get_or_create(
            username="demo",
            defaults={"email": "demo@vesti.app", "is_designer": True},
        )
        user.set_password("demo1234")
        user.save()

        cat_data = [
            ("tops", "Tops"),
            ("bottoms", "Bottoms"),
            ("outerwear", "Outerwear"),
            ("footwear", "Footwear"),
            ("accessories", "Accessories"),
        ]
        cats = {}
        for slug, name in cat_data:
            c, _ = Category.objects.get_or_create(slug=slug, defaults={"name": name})
            cats[slug] = c

        product_data = [
            ("Urban Jacket", "outerwear", 89.00, ["Black", "Brown"], ["S", "M", "L", "XL"], 15),
            ("Linen Shirt", "tops", 49.00, ["White", "Blue"], ["S", "M", "L"], 30),
            ("Slim Trousers", "bottoms", 65.00, ["Black", "Navy"], ["S", "M", "L", "XL"], 22),
            ("Canvas Sneakers", "footwear", 72.00, ["White", "Red"], ["S", "M", "L", "XL"], 18),
            ("Wool Scarf", "accessories", 38.00, ["Grey", "Beige", "Navy"], ["One Size"], 40),
            ("Leather Belt", "accessories", 44.00, ["Black", "Brown"], ["S", "M", "L"], 25),
        ]
        for name, cat_slug, price, colors, sizes, stock in product_data:
            Product.objects.get_or_create(
                name=name,
                defaults={
                    "category": cats[cat_slug],
                    "description": f"A premium {name.lower()} for the modern wardrobe.",
                    "price": price,
                    "colors": colors,
                    "sizes": sizes,
                    "stock": stock,
                },
            )

        self.stdout.write(self.style.SUCCESS("Seed data created"))
