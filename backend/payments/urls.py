from django.urls import path
from . import views
from .webhooks import alatpay_webhook

urlpatterns = [
    # Payment initiation
    path('payments/initiate/', views.InitiatePaymentView.as_view(), name='payment-initiate'),
    path('payments/<int:transaction_id>/status/', views.CheckPaymentStatusView.as_view(), name='payment-status'),
    path('payments/history/', views.TransactionHistoryView.as_view(), name='payment-history'),

    # Designer earnings
    path('earnings/', views.DesignerEarningsView.as_view(), name='earnings'),
    path('earnings/summary/', views.DesignerEarningsSummaryView.as_view(), name='earnings-summary'),
    path('payouts/request/', views.PayoutRequestView.as_view(), name='payout-request'),
    path('payouts/history/', views.PayoutHistoryView.as_view(), name='payout-history'),
    path('payout-methods/', views.PayoutMethodListCreateView.as_view(), name='payout-methods'),
    path('payout-methods/<int:pk>/', views.PayoutMethodDetailView.as_view(), name='payout-method-detail'),

    # Admin
    path('admin/transactions/', views.AdminTransactionListView.as_view(), name='admin-transactions'),
    path('admin/transactions/<int:pk>/', views.AdminTransactionDetailView.as_view(), name='admin-transaction-detail'),
    path('admin/earnings/', views.AdminEarningsListView.as_view(), name='admin-earnings'),
    path('admin/payouts/', views.AdminPayoutListView.as_view(), name='admin-payouts'),
    path('admin/payouts/process/', views.AdminPayoutProcessView.as_view(), name='admin-payouts-process'),
    path('admin/payouts/<int:pk>/finalize/', views.AdminPayoutFinalizeView.as_view(), name='admin-payout-finalize'),
    path('admin/dashboard/', views.AdminDashboardSummaryView.as_view(), name='admin-dashboard'),
    path('admin/ai-health/', views.AdminAIHealthView.as_view(), name='admin-ai-health'),

    # Webhook
    path('webhooks/alatpay/', alatpay_webhook, name='alatpay-webhook'),
]
