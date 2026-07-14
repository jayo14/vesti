from django.contrib import admin
from django.urls import path, include
from django.shortcuts import redirect
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('', lambda r: redirect('api/docs/')),
    path('admin/', admin.site.urls),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='docs'),
    path('api/auth/', include('accounts.urls')),
    path('api/', include('products.urls')),
    path('api/', include('wardrobe.urls')),
    path('api/', include('reviews.urls')),
    path('api/', include('orders.urls')),
    path('api/', include('studio.urls')),
    path('api/', include('ai.urls')),
]
