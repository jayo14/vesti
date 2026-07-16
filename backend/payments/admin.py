from django.contrib import admin
from .models import Transaction, DesignerEarning, Payout, PayoutMethod

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'amount', 'currency', 'status', 'payment_method', 'created_at']
    list_filter = ['status', 'payment_method', 'currency']
    search_fields = ['user__username', 'user__email', 'alatpay_transaction_id', 'virtual_account_number']

@admin.register(DesignerEarning)
class DesignerEarningAdmin(admin.ModelAdmin):
    list_display = ['id', 'designer', 'amount', 'net_amount', 'status', 'created_at']
    list_filter = ['status']
    search_fields = ['designer__username', 'designer__email']

@admin.register(Payout)
class PayoutAdmin(admin.ModelAdmin):
    list_display = ['id', 'designer', 'amount', 'status', 'bank_account_number', 'created_at']
    list_filter = ['status']
    search_fields = ['designer__username', 'designer__email']

@admin.register(PayoutMethod)
class PayoutMethodAdmin(admin.ModelAdmin):
    list_display = ['user', 'bank_name', 'bank_account_number', 'is_default']
    list_filter = ['bank_name', 'is_default']
