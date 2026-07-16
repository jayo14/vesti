from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import User, DesignerApplication, BodyProfile

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    full_name = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'password', 'bio', 'avatar', 'phone']

    def create(self, validated_data):
        full_name = validated_data.pop('full_name', '')
        username = validated_data.get('email', '').split('@')[0] or f"user_{User.objects.count() + 1}"
        user = User.objects.create_user(
            username=username,
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            bio=validated_data.get('bio', ''),
            avatar=validated_data.get('avatar', ''),
            phone=validated_data.get('phone', ''),
        )
        user.first_name = full_name
        user.save(update_fields=['first_name'])
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'bio', 'avatar', 'is_designer',
                  'date_joined', 'phone', 'bank_name', 'bank_account_number',
                  'bank_account_name']
        read_only_fields = ['id', 'date_joined']

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value

class DesignerSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'bio', 'avatar', 'date_joined', 'phone']

class UserListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'bio', 'avatar', 'is_designer', 'is_staff', 'is_active', 'date_joined', 'phone']


class DesignerApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = DesignerApplication
        fields = ['id', 'brand_name', 'bio', 'portfolio_links', 'status', 'rejection_reason',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'status', 'rejection_reason', 'created_at', 'updated_at']


class BodyProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = BodyProfile
        fields = [
            'height_cm', 'weight_kg', 'body_shape', 'measurements',
            'reference_image', 'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class BodyProfileMeasureSerializer(serializers.Serializer):
    person_image = serializers.CharField()
    height_cm = serializers.DecimalField(max_digits=5, decimal_places=1)
