import json
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from django.db import transaction as db_transaction
from django.conf import settings
from rest_framework import generics, permissions, status, views
from rest_framework.response import Response
from rest_framework.views import APIView

from orders.models import Order
from accounts.models import User
from .models import Transaction, DesignerEarning, Payout, PayoutMethod
from .serializers import (
    TransactionSerializer,
    TransactionCreateSerializer,
    TransactionCheckSerializer,
    DesignerEarningSerializer,
    PayoutSerializer,
    PayoutRequestSerializer,
    PayoutMethodSerializer,
    AdminPayoutProcessSerializer,
)
from .alatpay import AlatpayService


class InitiatePaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = TransactionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        order_id = data['order_id']

        try:
            order = Order.objects.get(id=order_id, user=request.user)
        except Order.DoesNotExist:
            return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

        if order.status != 'pending':
            return Response({"error": "Order is not pending"}, status=status.HTTP_400_BAD_REQUEST)

        existing = Transaction.objects.filter(order=order, status='pending').first()
        if existing and existing.virtual_account_number:
            return Response({
                "status": True,
                "data": {
                    "transaction_id": existing.id,
                    "virtual_account_number": existing.virtual_account_number,
                    "virtual_bank_name": existing.virtual_bank_name,
                    "amount": str(existing.amount),
                    "expired_at": existing.expired_at,
                }
            })

        result = AlatpayService.generate_virtual_account(
            email=data['customer_email'],
            amount=int(data['amount']),
            order_id=str(order.id),
            customer_data={
                "phone": data.get('customer_phone', ''),
                "firstName": data.get('customer_first_name', request.user.username),
                "lastName": data.get('customer_last_name', ''),
            },
            description=data.get('description', 'VESTI Checkout Payment'),
        )

        if not result.get('status'):
            return Response({
                "error": result.get('message', 'Failed to generate virtual account'),
                "detail": result.get('message', '')
            }, status=status.HTTP_502_BAD_GATEWAY)

        api_data = result.get('data', {})

        transaction = Transaction.objects.create(
            user=request.user,
            order=order,
            alatpay_transaction_id=api_data.get('transactionId', ''),
            virtual_account_number=api_data.get('virtualBankAccountNumber', ''),
            virtual_bank_name=self._bank_name_from_code(api_data.get('virtualBankCode', '')),
            virtual_bank_code=api_data.get('virtualBankCode', ''),
            amount=data['amount'],
            currency='NGN',
            status='pending',
            order_reference=str(order.id),
            description=data.get('description', 'VESTI Checkout Payment'),
            expired_at=timezone.now() + timedelta(hours=24),
        )

        return Response({
            "status": True,
            "data": {
                "transaction_id": transaction.id,
                "alatpay_transaction_id": transaction.alatpay_transaction_id,
                "virtual_account_number": transaction.virtual_account_number,
                "virtual_bank_name": transaction.virtual_bank_name,
                "amount": str(transaction.amount),
                "expired_at": transaction.expired_at,
            }
        })

    def _bank_name_from_code(self, code):
        banks = {"035": "WEMA Bank", "011": "First Bank", "058": "GTBank"}
        return banks.get(code, "WEMA Bank")


class CheckPaymentStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, transaction_id):
        try:
            transaction = Transaction.objects.get(id=transaction_id, user=request.user)
        except Transaction.DoesNotExist:
            return Response({"error": "Transaction not found"}, status=status.HTTP_404_NOT_FOUND)

        if transaction.alatpay_transaction_id:
            result = AlatpayService.check_transaction_status(transaction.alatpay_transaction_id)
            if result.get('status') and result.get('data', {}).get('status') == 'completed':
                transaction.status = 'paid'
                transaction.paid_at = timezone.now()
                transaction.save()
                self._process_earnings(transaction)

        return Response({
            "status": True,
            "data": {
                "transaction_id": transaction.id,
                "alatpay_transaction_id": transaction.alatpay_transaction_id,
                "status": transaction.status,
                "amount": str(transaction.amount),
                "paid_at": transaction.paid_at,
            }
        })

    def _process_earnings(self, transaction):
        if transaction.earnings.exists():
            return
        order = transaction.order
        if not order or not order.items:
            return
        platform_commission = Decimal('0.15')
        for item in order.items:
            designer_id = item.get('sellerId')
            if not designer_id:
                continue
            try:
                designer = User.objects.get(id=designer_id, is_designer=True)
            except User.DoesNotExist:
                continue
            item_total = Decimal(str(item.get('price', 0))) * int(item.get('quantity', 1))
            fee = (item_total * platform_commission).quantize(Decimal('0.01'))
            net = item_total - fee

            DesignerEarning.objects.create(
                designer=designer,
                transaction=transaction,
                order_item=item,
                amount=item_total,
                platform_fee=fee,
                net_amount=net,
                status='available',
            )


class TransactionHistoryView(generics.ListAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)


class DesignerEarningsView(generics.ListAPIView):
    serializer_class = DesignerEarningSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return DesignerEarning.objects.filter(designer=self.request.user)


class DesignerEarningsSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        earnings = DesignerEarning.objects.filter(designer=request.user)
        total = sum(e.net_amount for e in earnings)
        available = sum(e.net_amount for e in earnings if e.status == 'available')
        pending = sum(e.net_amount for e in earnings if e.status == 'pending')
        paid_out = sum(e.net_amount for e in earnings if e.status == 'paid')
        return Response({
            "total_earned": str(total),
            "available": str(available),
            "pending": str(pending),
            "paid_out": str(paid_out),
            "total_transactions": earnings.count(),
        })


class PayoutRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PayoutRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        amount = Decimal(str(serializer.validated_data['amount']))
        method_id = serializer.validated_data.get('payout_method_id')

        available = sum(
            e.net_amount for e in DesignerEarning.objects.filter(
                designer=request.user, status='available'
            )
        )
        if amount > available:
            return Response({"error": "Insufficient available balance"}, status=status.HTTP_400_BAD_REQUEST)

        if method_id:
            try:
                method = PayoutMethod.objects.get(id=method_id, user=request.user)
            except PayoutMethod.DoesNotExist:
                return Response({"error": "Payout method not found"}, status=status.HTTP_404_NOT_FOUND)
        else:
            method = PayoutMethod.objects.filter(user=request.user, is_default=True).first()
            if not method:
                return Response({"error": "No payout method found"}, status=status.HTTP_400_BAD_REQUEST)

        payout = Payout.objects.create(
            designer=request.user,
            amount=amount,
            status='pending',
            bank_name=method.bank_name,
            bank_account_number=method.bank_account_number,
            bank_account_name=method.bank_account_name,
        )

        earnings = DesignerEarning.objects.filter(
            designer=request.user, status='available'
        ).order_by('created_at')
        allocated = Decimal('0')
        for earning in earnings:
            if allocated >= amount:
                break
            earning.status = 'paid'
            earning.save()
            allocated += earning.net_amount

        return Response({
            "status": True,
            "data": {
                "payout_id": payout.id,
                "amount": str(payout.amount),
                "status": payout.status,
            }
        })


class PayoutHistoryView(generics.ListAPIView):
    serializer_class = PayoutSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Payout.objects.filter(designer=self.request.user)


class PayoutMethodListCreateView(generics.ListCreateAPIView):
    serializer_class = PayoutMethodSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PayoutMethod.objects.filter(user=self.request.user)


class PayoutMethodDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PayoutMethodSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PayoutMethod.objects.filter(user=self.request.user)


class AdminTransactionListView(generics.ListAPIView):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAdminUser]


class AdminTransactionDetailView(generics.RetrieveAPIView):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAdminUser]


class AdminEarningsListView(generics.ListAPIView):
    queryset = DesignerEarning.objects.all()
    serializer_class = DesignerEarningSerializer
    permission_classes = [permissions.IsAdminUser]


class AdminPayoutListView(generics.ListAPIView):
    queryset = Payout.objects.all()
    serializer_class = PayoutSerializer
    permission_classes = [permissions.IsAdminUser]


class AdminPayoutProcessView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        serializer = AdminPayoutProcessSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payout_ids = serializer.validated_data['payout_ids']
        payouts = Payout.objects.filter(id__in=payout_ids, status='pending')
        for payout in payouts:
            payout.status = 'processing'
            payout.save()
        return Response({
            "status": True,
            "processed": payouts.count(),
            "message": f"{payouts.count()} payouts marked as processing",
        })


class AdminDashboardSummaryView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        total_revenue = sum(t.amount for t in Transaction.objects.filter(status='paid'))
        pending_payouts = sum(p.amount for p in Payout.objects.filter(status='pending'))
        total_commission = sum(e.platform_fee for e in DesignerEarning.objects.all())
        return Response({
            "total_revenue": str(total_revenue),
            "pending_payouts": str(pending_payouts),
            "total_commission": str(total_commission),
            "total_transactions": Transaction.objects.count(),
            "paid_transactions": Transaction.objects.filter(status='paid').count(),
            "total_designers": User.objects.filter(is_designer=True).count(),
            "pending_payout_count": Payout.objects.filter(status='pending').count(),
        })
