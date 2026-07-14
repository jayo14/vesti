from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/', include('products.urls')),
    path('api/', include('wardrobe.urls')),
    path('api/', include('reviews.urls')),
    path('api/', include('orders.urls')),
    path('api/', include('studio.urls')),
    path('api/', include('ai.urls')),
]
