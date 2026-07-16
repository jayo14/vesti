import json
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from django.db import transaction as db_transaction, models
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
    """Batch-mark pending payouts as ``processing``.

    Kept for backwards-compat with the existing admin UI batch button; the
    per-payout finalise endpoint below lets ops walk each row through
    processing → paid / failed once the bank leg completes.
    """
    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        serializer = AdminPayoutProcessSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payout_ids = serializer.validated_data['payout_ids']
        payouts = Payout.objects.filter(id__in=payout_ids, status='pending')
        count = payouts.update(status='processing')
        return Response({
            "status": True,
            "processed": count,
            "message": f"{count} payouts marked as processing",
        })


class AdminPayoutFinalizeView(APIView):
    """Finalise a single payout row.

    Body: ``{"action": "mark_paid" | "mark_failed" | "reject", "note": "..."}``.
    Marks the payout row and, on failure/reject, returns associated
    ``DesignerEarning`` rows to the ``available`` pool so the designer can
    re-request the payout.
    """
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        try:
            payout = Payout.objects.get(pk=pk)
        except Payout.DoesNotExist:
            return Response({"detail": "Payout not found."}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get("action")
        note = request.data.get("note", "")

        if action == "mark_paid":
            if payout.status not in ("pending", "processing"):
                return Response(
                    {"detail": f"Cannot mark a {payout.status} payout as paid."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            payout.status = "paid"
            payout.paid_at = timezone.now()
            if note:
                payout.note = note
            payout.save()
            return Response(PayoutSerializer(payout).data)

        if action in ("mark_failed", "reject"):
            if payout.status == "paid":
                return Response(
                    {"detail": "Cannot fail a paid payout. Refund out-of-band instead."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            payout.status = "failed"
            payout.note = note or ("Rejected by admin" if action == "reject" else "Marked failed by admin")
            payout.save()
            # Return earnings previously allocated to this payout to the pool.
            # Earnings aren't FK-linked to Payout in this schema so we approximate
            # by re-opening the designer's most recent paid earnings up to the
            # payout amount.
            remaining = payout.amount
            earnings = (
                DesignerEarning.objects.filter(designer=payout.designer, status="paid")
                .order_by("-updated_at")
            )
            for earning in earnings:
                if remaining <= 0:
                    break
                earning.status = "available"
                earning.save()
                remaining -= earning.net_amount
            return Response(PayoutSerializer(payout).data)

        return Response(
            {"detail": "Invalid action. Use mark_paid, mark_failed, or reject."},
            status=status.HTTP_400_BAD_REQUEST,
        )


class AdminDashboardSummaryView(APIView):
    """Overview stats for the admin landing screen.

    Bundles revenue, payout, moderation, AI, and growth snapshots so the
    dashboard renders in one round trip instead of six.
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        from django.db.models import Sum, Count
        from products.models import Product
        from studio.models import Generation
        from accounts.models import DesignerApplication
        from disputes.models import Dispute

        total_revenue = Transaction.objects.filter(status='paid').aggregate(s=Sum('amount'))['s'] or 0
        pending_payouts = Payout.objects.filter(status='pending').aggregate(s=Sum('amount'))['s'] or 0
        total_commission = DesignerEarning.objects.aggregate(s=Sum('platform_fee'))['s'] or 0

        now = timezone.now()
        last_7 = now - timedelta(days=7)
        last_30 = now - timedelta(days=30)

        gen_last_7 = Generation.objects.filter(created_at__gte=last_7)
        gen_total_7 = gen_last_7.count()
        gen_completed_7 = gen_last_7.filter(status=Generation.STATUS_COMPLETED).count()
        gen_failed_7 = gen_last_7.filter(status=Generation.STATUS_FAILED).count()
        # Avoid divide-by-zero — a fresh install shouldn't blow up the dashboard.
        success_rate_7 = (
            round(gen_completed_7 * 100 / gen_total_7, 1) if gen_total_7 else 0
        )
        avg_latency = gen_last_7.filter(
            status=Generation.STATUS_COMPLETED, latency_ms__gt=0,
        ).aggregate(avg=models.Avg('latency_ms'))['avg'] or 0

        return Response({
            # Legacy fields kept for existing frontend compatibility.
            "total_revenue": str(total_revenue),
            "pending_payouts": str(pending_payouts),
            "total_commission": str(total_commission),
            "total_transactions": Transaction.objects.count(),
            "paid_transactions": Transaction.objects.filter(status='paid').count(),
            "total_designers": User.objects.filter(is_designer=True).count(),
            "pending_payout_count": Payout.objects.filter(status='pending').count(),
            # New snapshot sections.
            "queues": {
                "pending_designer_applications": DesignerApplication.objects.filter(status='pending').count(),
                "pending_product_reviews": Product.objects.filter(moderation_status='pending_review').count(),
                "open_disputes": Dispute.objects.filter(status__in=['open', 'in_review']).count(),
                "pending_payouts": Payout.objects.filter(status='pending').count(),
            },
            "ai_health_7d": {
                "generations": gen_total_7,
                "completed": gen_completed_7,
                "failed": gen_failed_7,
                "success_rate": success_rate_7,
                "avg_latency_ms": int(avg_latency),
            },
            "growth": {
                "new_users_7d": User.objects.filter(date_joined__gte=last_7).count(),
                "new_users_30d": User.objects.filter(date_joined__gte=last_30).count(),
                "new_designers_30d": User.objects.filter(
                    is_designer=True, date_joined__gte=last_30,
                ).count(),
                "new_products_30d": Product.objects.filter(created_at__gte=last_30).count(),
                "paid_transactions_30d": Transaction.objects.filter(
                    status='paid', created_at__gte=last_30,
                ).count(),
            },
        })


class AdminAIHealthView(APIView):
    """Structured AI health metrics for the dedicated AI dashboard tab.

    Returns success/failure counts, failure-reason breakdown, latency
    distribution, and the latest 20 failed generations for quick triage.
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        from studio.models import Generation

        window_days = int(request.query_params.get("days", "7"))
        cutoff = timezone.now() - timedelta(days=window_days)

        qs = Generation.objects.filter(created_at__gte=cutoff)
        total = qs.count()
        completed = qs.filter(status=Generation.STATUS_COMPLETED).count()
        failed = qs.filter(status=Generation.STATUS_FAILED).count()
        processing = qs.filter(status=Generation.STATUS_PROCESSING).count()

        by_reason = (
            qs.filter(status=Generation.STATUS_FAILED)
            .values("failure_reason")
            .annotate(count=models.Count("id"))
            .order_by("-count")
        )

        latency_stats = qs.filter(
            status=Generation.STATUS_COMPLETED, latency_ms__gt=0,
        ).aggregate(
            avg=models.Avg("latency_ms"),
            fastest=models.Min("latency_ms"),
            slowest=models.Max("latency_ms"),
        )

        recent_failures = list(
            qs.filter(status=Generation.STATUS_FAILED)
            .select_related("user", "product")
            .order_by("-created_at")[:20]
            .values(
                "id", "created_at", "failure_reason", "error", "latency_ms",
                "user__username", "product__name", "model",
            )
        )

        return Response({
            "window_days": window_days,
            "totals": {
                "generations": total,
                "completed": completed,
                "failed": failed,
                "processing": processing,
                "success_rate": round(completed * 100 / total, 1) if total else 0,
            },
            "failures_by_reason": [
                {"reason": row["failure_reason"] or "unknown", "count": row["count"]}
                for row in by_reason
            ],
            "latency_ms": {
                "avg": int(latency_stats["avg"] or 0),
                "fastest": latency_stats["fastest"] or 0,
                "slowest": latency_stats["slowest"] or 0,
            },
            "recent_failures": [
                {
                    "id": row["id"],
                    "created_at": row["created_at"],
                    "failure_reason": row["failure_reason"] or "unknown",
                    "error": row["error"],
                    "latency_ms": row["latency_ms"],
                    "user_username": row["user__username"],
                    "product_name": row["product__name"],
                    "model": row["model"],
                }
                for row in recent_failures
            ],
        })
