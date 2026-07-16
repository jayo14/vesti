from rest_framework import serializers
from .models import Product, Category
from reviews.serializers import ReviewSerializer


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class ProductListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    designer_name = serializers.CharField(source='designer.username', read_only=True, default='')
    designer_id = serializers.PrimaryKeyRelatedField(source='designer', read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'price', 'currency', 'category', 'designer_id', 'designer_name',
            'image_url', 'images', 'colors', 'sizes', 'tags', 'stock', 'stock_count', 'rating',
            'featured', 'material', 'fit_type', 'ships_from', 'ships_within', 'returns',
            'created_at', 'is_published',
        ]

    def get_image_url(self, obj):
        first = obj.images[0] if obj.images else None
        if isinstance(first, dict):
            return first.get("url")
        return first


class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    designer_name = serializers.CharField(source='designer.username', read_only=True, default='')
    designer_id = serializers.PrimaryKeyRelatedField(source='designer', read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'price', 'currency', 'category', 'designer_id',
            'designer_name', 'image_url', 'images', 'colors', 'sizes', 'tags', 'stock', 'stock_count',
            'rating', 'featured', 'material', 'fit_type', 'ships_from', 'ships_within',
            'returns', 'reviews', 'created_at', 'updated_at', 'is_published',
        ]

    def get_image_url(self, obj):
        first = obj.images[0] if obj.images else None
        if isinstance(first, dict):
            return first.get("url")
        return first


class ProductCreateSerializer(serializers.ModelSerializer):
    image_url = serializers.URLField(required=False, write_only=True, allow_blank=True)

    class Meta:
        model = Product
        fields = [
            'name', 'description', 'price', 'currency', 'category', 'designer',
            'image_url', 'images', 'sizes', 'colors', 'tags', 'stock', 'stock_count',
            'rating', 'featured', 'material', 'fit_type', 'ships_from', 'ships_within',
            'returns', 'is_published', 'moderation_status',
        ]
        read_only_fields = ['moderation_status']

    def create(self, validated_data):
        # New products start as draft; designer can submit for review
        validated_data.setdefault('moderation_status', 'draft')
        validated_data.setdefault('is_published', False)
        image_url = validated_data.pop('image_url', '')
        instance = super().create(validated_data)
        if image_url and not instance.images:
            instance.images = [image_url]
            instance.save(update_fields=['images'])
        return instance

    def update(self, instance, validated_data):
        # Don't allow designer to overwrite moderation_status via update
        validated_data.pop('moderation_status', None)
        image_url = validated_data.pop('image_url', '')
        instance = super().update(instance, validated_data)
        if image_url:
            instance.images = [image_url]
            instance.save(update_fields=['images'])
        return instance
