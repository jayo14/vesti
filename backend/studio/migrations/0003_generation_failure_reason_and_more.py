from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("studio", "0002_generation"),
    ]

    operations = [
        migrations.AddField(
            model_name="generation",
            name="failure_reason",
            field=models.CharField(
                blank=True,
                choices=[
                    ("no_person_detected", "No person detected"),
                    ("multiple_people", "Multiple people in frame"),
                    ("low_pose_confidence", "Low pose confidence"),
                    ("segmentation_failed", "Garment segmentation failed"),
                    ("model_unavailable", "Model unavailable"),
                    ("model_timeout", "Model timeout"),
                    ("pipeline_unreachable", "Vision pipeline unreachable"),
                    ("empty_result", "Empty result from pipeline"),
                    ("unknown", "Unknown error"),
                ],
                default="",
                help_text="Structured failure code from the vision pipeline (blank on success).",
                max_length=40,
            ),
        ),
        migrations.AddField(
            model_name="generation",
            name="latency_ms",
            field=models.IntegerField(
                default=0,
                help_text="Wall-clock duration from row creation to terminal status.",
            ),
        ),
        migrations.AddField(
            model_name="generation",
            name="flagged",
            field=models.BooleanField(
                default=False,
                help_text="Admin flag for inappropriate or bad output.",
            ),
        ),
    ]
