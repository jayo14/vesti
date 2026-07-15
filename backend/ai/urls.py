from django.urls import path
from .views import OutfitRecommendView, StylingSuggestionsView, TryOnView, SmartSearchView, EditView, GenerateView

urlpatterns = [
    path('outfit-recommend/', OutfitRecommendView.as_view(), name='outfit-recommend'),
    path('styling-suggestions/', StylingSuggestionsView.as_view(), name='styling-suggestions'),
    path('try-on/', TryOnView.as_view(), name='try-on'),
    path('smart-search/', SmartSearchView.as_view(), name='smart-search'),
    path('edit/', EditView.as_view(), name='edit'),
    path('generate/', GenerateView.as_view(), name='generate'),
]
