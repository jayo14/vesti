from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import (
    RegisterSerializer,
    UserSerializer,
    DesignerSerializer,
    UserListSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
)
from .models import User, DesignerApplication
from .permissions import IsDesigner


def _notify_applicant(application, *, approved: bool):
    """Best-effort notification when an application is reviewed.

    Emails the applicant via ``send_mail`` when a real EMAIL_HOST is configured;
    otherwise silently no-ops so local dev doesn't spew errors. The admin UI
    surfaces the decision regardless, so this is purely a courtesy notification.
    """
    to = getattr(application.user, 'email', '') or ''
    if not to:
        return
    if not settings.EMAIL_HOST or settings.EMAIL_HOST in ('localhost',):
        return
    subject = (
        "Your VESTI designer application was approved"
        if approved
        else "Update on your VESTI designer application"
    )
    body = (
        f"Hi {application.user.username},\n\n"
        f"Your designer application for '{application.brand_name}' was approved. "
        f"You can now list products in the marketplace."
        if approved
        else
        f"Hi {application.user.username},\n\n"
        f"We reviewed your designer application for '{application.brand_name}' "
        f"and are unable to approve it at this time.\n\n"
        f"Reason: {application.rejection_reason or 'Not specified.'}\n"
    )
    try:
        send_mail(
            subject, body, settings.DEFAULT_FROM_EMAIL, [to], fail_silently=True,
        )
    except Exception:
        pass

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def email_login(request):
    email = request.data.get('email', '')
    password = request.data.get('password', '')
    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        return Response({'detail': 'No active account found with the given credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    if not user.check_password(password):
        return Response({'detail': 'No active account found with the given credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(user)
    return Response({'access': str(refresh.access_token), 'refresh': str(refresh)})


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class PasswordResetRequestView(generics.GenericAPIView):
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        user = User.objects.filter(email__iexact=email).first()
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = f"{request.scheme}://{request.get_host()}/api/auth/password-reset-confirm/?uid={uid}&token={token}"
            if settings.EMAIL_HOST and settings.EMAIL_HOST not in ('localhost',):
                send_mail(
                    'Reset your VESTI password',
                    f"Use the link below to reset your password:\n{reset_url}",
                    settings.DEFAULT_FROM_EMAIL,
                    [email],
                    fail_silently=False,
                )
            else:
                return Response(
                    {'detail': 'Password reset initiated.', 'uid': uid, 'token': token},
                    status=status.HTTP_200_OK,
                )
        return Response({'detail': 'If an account exists for that email, a reset link has been sent.'}, status=status.HTTP_200_OK)

class PasswordResetConfirmView(generics.GenericAPIView):
    serializer_class = PasswordResetConfirmSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            uid = force_str(urlsafe_base64_decode(serializer.validated_data['uid']))
            user = User.objects.get(pk=uid)
        except (User.DoesNotExist, ValueError, TypeError):
            return Response({'detail': 'Invalid reset link.'}, status=status.HTTP_400_BAD_REQUEST)
        if not default_token_generator.check_token(user, serializer.validated_data['token']):
            return Response({'detail': 'Invalid or expired reset link.'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'detail': 'Password has been reset successfully.'}, status=status.HTTP_200_OK)

class DesignersListView(generics.ListAPIView):
    queryset = User.objects.filter(is_designer=True)
    serializer_class = DesignerSerializer
    permission_classes = [permissions.AllowAny]

class UsersListView(generics.ListAPIView):
    """Admin-only user list. Powers the Users tab in the admin panel."""
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserListSerializer
    permission_classes = [permissions.IsAdminUser]


@api_view(['GET', 'PATCH'])
@permission_classes([permissions.IsAdminUser])
def manage_user(request, user_id):
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(UserSerializer(user).data)

    if request.method == 'PATCH':
        is_designer = request.data.get('is_designer')
        is_staff = request.data.get('is_staff')
        if is_designer is not None:
            user.is_designer = bool(is_designer)
        if is_staff is not None:
            user.is_staff = bool(is_staff)
        user.save()
        return Response({'detail': 'User updated.', 'is_designer': user.is_designer, 'is_staff': user.is_staff})


@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def bank_details(request):
    user = request.user
    if request.method == 'GET':
        return Response({
            'bank_name': user.bank_name,
            'account_number': user.bank_account_number,
            'account_name': user.bank_account_name,
        })
    user.bank_name = request.data.get('bank_name', user.bank_name)
    user.bank_account_number = request.data.get('account_number', user.bank_account_number)
    user.bank_account_name = request.data.get('account_name', user.bank_account_name)
    user.save(update_fields=['bank_name', 'bank_account_number', 'bank_account_name'])
    return Response({'detail': 'Bank details updated.'})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_role(request):
    return Response({
        'is_designer': request.user.is_designer,
        'is_staff': request.user.is_staff,
        'is_superuser': request.user.is_superuser,
        'username': request.user.username,
        'email': request.user.email,
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def become_designer(request):
    user = request.user
    if user.is_designer:
        return Response({'detail': 'Already a designer.'}, status=status.HTTP_400_BAD_REQUEST)
    user.is_designer = True
    user.save()
    return Response({'detail': 'You are now a designer.', 'is_designer': True})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def apply_designer(request):
    from .serializers import DesignerApplicationSerializer
    serializer = DesignerApplicationSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    serializer.save(user=request.user)
    return Response({'detail': 'Application submitted. Awaiting review.', 'status': 'pending'})


class AdminDesignerApplicationListView(APIView):
    """List designer applications (defaults to pending), latest first."""
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        status_filter = request.query_params.get('status', 'pending')
        qs = DesignerApplication.objects.select_related('user', 'reviewed_by').all()
        if status_filter != 'all':
            qs = qs.filter(status=status_filter)
        return Response([
            {
                'id': a.id,
                'brand_name': a.brand_name,
                'bio': a.bio,
                'portfolio_links': a.portfolio_links,
                'status': a.status,
                'rejection_reason': a.rejection_reason,
                'created_at': a.created_at,
                'updated_at': a.updated_at,
                'user': {
                    'id': a.user.id,
                    'username': a.user.username,
                    'email': a.user.email,
                    'avatar': a.user.avatar,
                    'is_designer': a.user.is_designer,
                },
                'reviewed_by': a.reviewed_by.username if a.reviewed_by else None,
            }
            for a in qs
        ])


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def review_designer_application(request, application_id):
    try:
        app = DesignerApplication.objects.get(id=application_id, status='pending')
    except DesignerApplication.DoesNotExist:
        return Response({'detail': 'Application not found or already reviewed.'}, status=status.HTTP_404_NOT_FOUND)

    action = request.data.get('action')
    if action == 'approve':
        app.status = 'approved'
        app.user.is_designer = True
        app.user.save()
        app.reviewed_by = request.user
        app.save()
        _notify_applicant(app, approved=True)
        return Response({'detail': 'Designer application approved.', 'status': 'approved'})
    elif action == 'reject':
        reason = request.data.get('rejection_reason', '').strip()
        if not reason:
            return Response(
                {'detail': 'A rejection reason is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        app.status = 'rejected'
        app.rejection_reason = reason
        app.reviewed_by = request.user
        app.save()
        _notify_applicant(app, approved=False)
        return Response({'detail': 'Designer application rejected.', 'status': 'rejected'})
    return Response({'detail': 'Invalid action. Use "approve" or "reject".'}, status=status.HTTP_400_BAD_REQUEST)


class DesignerDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsDesigner]

    def get(self, request):
        from products.models import Product
        from orders.models import Order
        from payments.models import DesignerEarning

        products = Product.objects.filter(designer=request.user)
        earnings = DesignerEarning.objects.filter(designer=request.user, status='available')
        total_available = sum(e.net_amount for e in earnings)

        all_orders = Order.objects.all()
        designer_orders = []
        uid = str(request.user.id)
        for o in all_orders.order_by('-created_at')[:50]:
            for item in (o.items or []):
                if isinstance(item, dict) and item.get('sellerId') == uid:
                    designer_orders.append(o)
                    break

        # Per-product try-on and purchase counts within the funnel window (14 days).
        # A designer needs to know: how many people tried this on, and of those,
        # how many actually bought (any variant). High try-ons + zero purchases is
        # the actionable signal — likely a photo, description, or price issue.
        from studio.models import Generation
        from django.utils import timezone
        from datetime import timedelta

        FUNNEL_WINDOW_DAYS = 14
        window_start = timezone.now() - timedelta(days=FUNNEL_WINDOW_DAYS)

        product_ids = [p.id for p in products]
        tryon_data = {pid: {"total": 0, "window": 0} for pid in product_ids}
        for pid in product_ids:
            gens = Generation.objects.filter(product_id=pid)
            tryon_data[pid]["total"] = gens.count()
            tryon_data[pid]["window"] = gens.filter(created_at__gte=window_start).count()

        purchase_counts = {pid: 0 for pid in product_ids}
        purchase_counts_window = {pid: 0 for pid in product_ids}
        paid_orders = Order.objects.filter(status__in=('paid', 'shipped', 'delivered'))
        for o in paid_orders:
            for item in (o.items or []):
                if not isinstance(item, dict) or item.get('sellerId') != uid:
                    continue
                pid_raw = item.get('productId') or item.get('product_id') or item.get('id')
                try:
                    pid = int(pid_raw)
                except (TypeError, ValueError):
                    continue
                if pid not in purchase_counts:
                    continue
                qty = int(item.get('quantity', 1) or 1)
                purchase_counts[pid] += qty
                if o.created_at >= window_start:
                    purchase_counts_window[pid] += qty

        return Response({
            'products_count': products.count(),
            'orders_count': len(designer_orders),
            'available_balance': str(total_available),
            'funnel_window_days': FUNNEL_WINDOW_DAYS,
            'products': [
                {
                    'id': p.id, 'name': p.name, 'price': str(p.price), 'stock': p.stock,
                    'image_url': p.images[0] if p.images else None,
                    'images': p.images,
                    'is_published': p.is_published,
                    'moderation_status': p.moderation_status,
                    'rejection_reason': p.rejection_reason,
                    'material': p.material,
                    'fit_type': p.fit_type,
                    'category_id': p.category_id, 'description': p.description,
                    'tryons_total': tryon_data[p.id]["total"],
                    'tryons_window': tryon_data[p.id]["window"],
                    'purchases_total': purchase_counts[p.id],
                    'purchases_window': purchase_counts_window[p.id],
                }
                for p in products
            ],
            'recent_orders': [
                {'id': o.id, 'status': o.status, 'total': str(o.total)}
                for o in designer_orders[:10]
            ],
        })
