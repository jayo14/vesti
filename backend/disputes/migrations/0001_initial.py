from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("orders", "0002_order_shipping_info"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Dispute",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("reason", models.CharField(
                    choices=[
                        ("not_delivered", "Order not delivered"),
                        ("wrong_item", "Wrong item received"),
                        ("damaged", "Item damaged / defective"),
                        ("not_as_described", "Item not as described"),
                        ("refund_request", "Refund not honoured"),
                        ("other", "Other"),
                    ],
                    max_length=40,
                )),
                ("description", models.TextField(blank=True)),
                ("status", models.CharField(
                    choices=[
                        ("open", "Open"),
                        ("in_review", "In review"),
                        ("resolved", "Resolved"),
                        ("rejected", "Rejected"),
                    ],
                    default="open",
                    max_length=20,
                )),
                ("resolution_notes", models.TextField(blank=True)),
                ("resolved_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("order", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="disputes",
                    to="orders.order",
                )),
                ("resolved_by", models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name="disputes_resolved",
                    to=settings.AUTH_USER_MODEL,
                )),
                ("user", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="disputes_raised",
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
