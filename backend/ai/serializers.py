from rest_framework import serializers

class AIRequestSerializer(serializers.Serializer):
    prompt = serializers.CharField(required=False, allow_blank=True)
    image = serializers.URLField(required=False, allow_blank=True)
    product_ids = serializers.ListField(child=serializers.IntegerField(), required=False)
    wardrobe_item_ids = serializers.ListField(child=serializers.IntegerField(), required=False)

class AIResponseSerializer(serializers.Serializer):
    result = serializers.JSONField()
