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
from .models import User
from .permissions import IsDesigner

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
    queryset = User.objects.all()
    serializer_class = UserListSerializer
    permission_classes = [permissions.AllowAny]


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


class DesignerDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsDesigner]

    def get(self, request):
        from products.models import Product
        from orders.models import Order
        from payments.models import DesignerEarning
        import json

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

        return Response({
            'products_count': products.count(),
            'orders_count': len(designer_orders),
            'available_balance': str(total_available),
            'products': [{'id': p.id, 'name': p.name, 'price': str(p.price), 'stock': p.stock, 'image_url': p.images[0] if p.images else None, 'is_published': p.is_published, 'category_id': p.category_id, 'description': p.description} for p in products],
            'recent_orders': [
                {'id': o.id, 'status': o.status, 'total': str(o.total)}
                for o in designer_orders[:10]
            ],
        })
