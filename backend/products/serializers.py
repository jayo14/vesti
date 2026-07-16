from rest_framework import serializers
from .models import Product, Category
from reviews.serializers import ReviewSerializer


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class DesignerSummarySerializer(serializers.ModelSerializer):
    """Minimal designer info embedded in product payloads."""

    class Meta:
        model = "accounts.User"
        fields = ["id", "username", "avatar", "is_designer"]


class ProductListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    designer_name = serializers.CharField(source='designer.username', read_only=True, default='')
    designer = DesignerSummarySerializer(read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'price', 'currency', 'category', 'designer', 'designer_name',
            'images', 'colors', 'sizes', 'tags', 'stock', 'stock_count', 'rating',
            'featured', 'material', 'fit_type', 'ships_from', 'ships_within', 'returns',
            'created_at', 'is_published', 'image_url',
        ]

    def get_image_url(self, obj):
        return obj.images[0] if obj.images else None


class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    designer_name = serializers.CharField(source='designer.username', read_only=True, default='')
    designer = DesignerSummarySerializer(read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'price', 'currency', 'category', 'designer',
            'designer_name', 'images', 'colors', 'sizes', 'tags', 'stock', 'stock_count',
            'rating', 'featured', 'material', 'fit_type', 'ships_from', 'ships_within',
            'returns', 'reviews', 'created_at', 'updated_at', 'is_published', 'image_url',
        ]

    def get_image_url(self, obj):
        return obj.images[0] if obj.images else None


class ProductCreateSerializer(serializers.ModelSerializer):
    image_url = serializers.URLField(required=False, write_only=True, allow_blank=True)

    class Meta:
        model = Product
        fields = [
            'name', 'description', 'price', 'currency', 'category', 'designer',
            'image_url', 'images', 'sizes', 'colors', 'tags', 'stock', 'stock_count',
            'rating', 'featured', 'material', 'fit_type', 'ships_from', 'ships_within',
            'returns', 'is_published',
        ]

    def create(self, validated_data):
        image_url = validated_data.pop('image_url', '')
        instance = super().create(validated_data)
        if image_url and not instance.images:
            instance.images = [image_url]
            instance.save(update_fields=['images'])
        return instance

    def update(self, instance, validated_data):
        image_url = validated_data.pop('image_url', '')
        instance = super().update(instance, validated_data)
        if image_url:
            instance.images = [image_url]
            instance.save(update_fields=['images'])
        return instance
