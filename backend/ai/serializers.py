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


class OutfitRecommendSerializer(serializers.Serializer):
    occasion = serializers.CharField(required=True)
    weather = serializers.ChoiceField(
        choices=["hot", "warm", "mild", "cool", "cold", "rainy", "snowy"],
        required=False,
        default="mild",
    )
    timeOfDay = serializers.ChoiceField(
        choices=["morning", "afternoon", "evening", "night"],
        required=False,
        default="afternoon",
    )
    dressCode = serializers.ChoiceField(
        choices=["casual", "smart-casual", "business", "formal", "black-tie", "creative"],
        required=False,
        default="smart-casual",
    )
    wardrobe_item_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False
    )


class StylingSuggestSerializer(serializers.Serializer):
    productId = serializers.CharField(required=True)
    productImage = serializers.CharField(required=False, allow_blank=True)
    productName = serializers.CharField(required=False, allow_blank=True)
    productDescription = serializers.CharField(required=False, allow_blank=True)


class SmartSearchSerializer(serializers.Serializer):
    query = serializers.CharField(required=True)


class EditSerializer(serializers.Serializer):
    image = serializers.CharField(required=True)
    prompt = serializers.CharField(required=True)
    component = serializers.CharField(required=False, allow_blank=True)
    preservePerson = serializers.BooleanField(required=False, default=True)
