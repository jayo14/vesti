from django.contrib import admin
from django.urls import path, include
from django.shortcuts import redirect
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from .upload import UploadView

urlpatterns = [
    path('', lambda r: redirect('api/docs/')),
    path('admin/', admin.site.urls),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='docs'),
    path('api/auth/', include('accounts.urls')),
    path('api/', include('products.urls')),
    path('api/', include('wardrobe.urls')),
    path('api/', include('reviews.urls')),
    path('api/', include('orders.urls')),
    path('api/', include('studio.urls')),
    path('api/', include('ai.urls')),
    path('api/', include('payments.urls')),
    path('api/upload/', UploadView.as_view(), name='upload'),
    path('api/health/', lambda r: JsonResponse({"status": "ok"}), name='health'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
