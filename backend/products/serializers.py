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

    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'category', 'designer', 'designer_name', 'images', 'colors', 'stock', 'created_at']

class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    designer_name = serializers.CharField(source='designer.username', read_only=True, default='')

    class Meta:
        model = Product
        fields = '__all__'

class ProductCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['name', 'description', 'price', 'category', 'images', 'sizes', 'colors', 'stock']
