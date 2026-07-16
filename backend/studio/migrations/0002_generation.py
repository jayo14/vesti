from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('studio', '0001_initial'),
        ('products', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Generation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('person_image', models.TextField(help_text='Stored image URL or base64 data URL.')),
                ('garment_image', models.TextField(blank=True, help_text='Explicit garment cutout URL/data URL if not derived from a product.')),
                ('result_image', models.TextField(blank=True, help_text='Result image URL or base64 data URL.')),
                ('fit_analysis', models.JSONField(blank=True, default=dict, help_text='Structured Fit Analysis object from vision_engine.')),
                ('fit_confidence', models.FloatField(default=0.0)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('processing', 'Processing'), ('completed', 'Completed'), ('failed', 'Failed')], default='pending', max_length=20)),
                ('error', models.TextField(blank=True)),
                ('model', models.CharField(blank=True, help_text='Which try-on backend served the request.', max_length=60)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('product', models.ForeignKey(blank=True, null=True, on_delete=models.SET_NULL, related_name='generations', to='products.product')),
                ('user', models.ForeignKey(on_delete=models.CASCADE, related_name='generations', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
