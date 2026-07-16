from rest_framework import serializers
from .models import Transaction, DesignerEarning, Payout, PayoutMethod


class TransactionSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Transaction
        fields = '__all__'
        read_only_fields = ['user', 'alatpay_transaction_id', 'virtual_account_number',
                           'virtual_bank_name', 'virtual_bank_code']


class TransactionCreateSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    order_id = serializers.CharField()
    description = serializers.CharField(required=False, default="VESTI Checkout Payment")
    customer_email = serializers.EmailField()
    customer_phone = serializers.CharField(required=False, allow_blank=True)
    customer_first_name = serializers.CharField(required=False, allow_blank=True)
    customer_last_name = serializers.CharField(required=False, allow_blank=True)


class TransactionCheckSerializer(serializers.Serializer):
    transaction_id = serializers.CharField()


class DesignerEarningSerializer(serializers.ModelSerializer):
    designer_username = serializers.CharField(source='designer.username', read_only=True)
    transaction_id_display = serializers.CharField(source='transaction.alatpay_transaction_id', read_only=True)

    class Meta:
        model = DesignerEarning
        fields = '__all__'
        read_only_fields = ['designer']


class PayoutSerializer(serializers.ModelSerializer):
    designer_username = serializers.CharField(source='designer.username', read_only=True)

    class Meta:
        model = Payout
        fields = '__all__'
        read_only_fields = ['designer']


class PayoutRequestSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    payout_method_id = serializers.IntegerField(required=False)


class PayoutMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayoutMethod
        fields = '__all__'
        read_only_fields = ['user']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class AdminPayoutProcessSerializer(serializers.Serializer):
    payout_ids = serializers.ListField(child=serializers.IntegerField())
