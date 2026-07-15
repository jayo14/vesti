from rest_framework import serializers

class AIRequestSerializer(serializers.Serializer):
    prompt = serializers.CharField(required=False, allow_blank=True)
    image = serializers.URLField(required=False, allow_blank=True)
    product_ids = serializers.ListField(child=serializers.IntegerField(), required=False)
    wardrobe_item_ids = serializers.ListField(child=serializers.IntegerField(), required=False)

class AIResponseSerializer(serializers.Serializer):
    result = serializers.JSONField()

class GenerateSerializer(serializers.Serializer):
    prompt = serializers.CharField(required=True)
    garment_type = serializers.CharField(required=False, allow_blank=True)
    colour = serializers.CharField(required=False, allow_blank=True)
    material = serializers.CharField(required=False, allow_blank=True)

class WardrobeAnalyzeSerializer(serializers.Serializer):
    analysis = serializers.JSONField()
