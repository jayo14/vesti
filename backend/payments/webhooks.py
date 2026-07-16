import json
import logging
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.conf import settings
from .models import Transaction, DesignerEarning
from .alatpay import AlatpayService

logger = logging.getLogger(__name__)


@csrf_exempt
def alatpay_webhook(request):
    if request.method != 'POST':
        return HttpResponse(status=405)

    received_signature = request.headers.get('x-signature', '')
    payload_body = request.body

    if not AlatpayService.verify_webhook_signature(payload_body, received_signature):
        logger.warning("Invalid webhook signature received")
        return JsonResponse({"error": "Invalid signature"}, status=401)

    try:
        payload = json.loads(payload_body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    try:
        data = payload.get("Value", {}).get("Data", payload.get("data", {}))
        status_val = data.get("Status", "").lower()
        transaction_id = data.get("Id", "")

        if status_val in ("completed", "success") and transaction_id:
            transaction = Transaction.objects.filter(
                alatpay_transaction_id=transaction_id
            ).first()

            if transaction and transaction.status == 'pending':
                transaction.status = 'paid'
                transaction.paid_at = timezone.now()
                transaction.channel = data.get("Channel", "")
                transaction.fee = data.get("FeeAmount", 0)
                transaction.save()

                _process_earnings(transaction)
                logger.info(f"Transaction {transaction_id} marked as paid via webhook")

                order = transaction.order
                if order and order.status == 'pending':
                    order.status = 'paid'
                    order.save()

        return JsonResponse({"status": "received"}, status=200)

    except Exception as e:
        logger.error(f"Webhook processing error: {e}")
        return JsonResponse({"error": "Processing error"}, status=500)


def _process_earnings(transaction):
    if transaction.earnings.exists():
        return
    order = transaction.order
    if not order or not order.items:
        return
    from decimal import Decimal
    from accounts.models import User
    from .models import DesignerEarning

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
