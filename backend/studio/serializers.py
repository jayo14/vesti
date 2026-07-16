from rest_framework import serializers
from .models import Project, Generation


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = '__all__'
        read_only_fields = ['user']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class GenerationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Generation
        fields = [
            'id', 'user', 'product', 'person_image', 'garment_image',
            'result_image', 'fit_analysis', 'fit_confidence', 'status',
            'error', 'model', 'created_at',
        ]
        read_only_fields = ['id', 'user', 'created_at']
