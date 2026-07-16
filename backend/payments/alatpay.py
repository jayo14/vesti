import hashlib
import hmac
import base64
import logging
from django.conf import settings
from django.utils import timezone
import requests

logger = logging.getLogger(__name__)

ALATPAY_BASE_URL = "https://apibox.alatpay.ng"

def _headers():
    return {
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": settings.ALATPAY_SECRET_KEY,
    }

class AlatpayService:

    @staticmethod
    def generate_virtual_account(email, amount, order_id, customer_data, description="VESTI Checkout Payment"):
        url = f"{ALATPAY_BASE_URL}/bank-transfer/api/v1/bankTransfer/virtualAccount"
        payload = {
            "businessId": settings.ALATPAY_BUSINESS_ID,
            "amount": amount,
            "currency": "NGN",
            "orderId": order_id,
            "description": description,
            "customer": {
                "email": email,
                "phone": customer_data.get("phone", ""),
                "firstName": customer_data.get("firstName", ""),
                "lastName": customer_data.get("lastName", ""),
                "metadata": "{}",
            },
        }
        try:
            resp = requests.post(url, json=payload, headers=_headers(), timeout=30)
            resp.raise_for_status()
            return resp.json()
        except requests.RequestException as e:
            logger.error(f"ALATPay virtual account error: {e}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Response: {e.response.text}")
            return {"status": False, "message": str(e)}

    @staticmethod
    def check_transaction_status(transaction_id):
        url = f"{ALATPAY_BASE_URL}/bank-transfer/api/v1/bankTransfer/transactions/{transaction_id}"
        try:
            resp = requests.get(url, headers=_headers(), timeout=30)
            resp.raise_for_status()
            return resp.json()
        except requests.RequestException as e:
            logger.error(f"ALATPay transaction status error: {e}")
            return {"status": False, "message": str(e)}

    @staticmethod
    def list_transactions(business_id=None, page=1, limit=20, **filters):
        url = f"{ALATPAY_BASE_URL}/alatpaytransaction/api/v1/transactions"
        params = {
            "BusinessId": business_id or settings.ALATPAY_BUSINESS_ID,
            "Page": page,
            "Limit": limit,
        }
        for key, value in filters.items():
            if value is not None:
                params[key] = value
        try:
            resp = requests.get(url, headers=_headers(), params=params, timeout=30)
            resp.raise_for_status()
            return resp.json()
        except requests.RequestException as e:
            logger.error(f"ALATPay list transactions error: {e}")
            return {"status": False, "message": str(e)}

    @staticmethod
    def list_settlements(business_id=None, page=1, limit=20, **filters):
        url = f"{ALATPAY_BASE_URL}/payment-settlement/api/v1/settlements"
        params = {
            "businessId": business_id or settings.ALATPAY_BUSINESS_ID,
            "page": page,
            "limit": limit,
        }
        for key, value in filters.items():
            if value is not None:
                params[key] = value
        try:
            resp = requests.get(url, headers=_headers(), params=params, timeout=30)
            resp.raise_for_status()
            return resp.json()
        except requests.RequestException as e:
            logger.error(f"ALATPay settlements error: {e}")
            return {"status": False, "message": str(e)}

    @staticmethod
    def verify_webhook_signature(payload_body, received_signature):
        secret = settings.ALATPAY_WEBHOOK_SECRET.encode('utf-8')
        computed_hmac = hmac.new(secret, payload_body, hashlib.sha256).digest()
        computed_signature = base64.b64encode(computed_hmac).decode()
        return hmac.compare_digest(computed_signature, received_signature)
