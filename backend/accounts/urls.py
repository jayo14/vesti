from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegisterView, MeView, PasswordResetRequestView, PasswordResetConfirmView,
    DesignersListView, UsersListView, my_role, become_designer, DesignerDashboardView,
    manage_user, email_login, apply_designer, review_designer_application,
    bank_details, AdminDesignerApplicationListView,
    BodyProfileRetrieveUpdateView, BodyProfileMeasureView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', email_login, name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('me/', MeView.as_view(), name='me'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password-reset'),
    path('password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('designers/', DesignersListView.as_view(), name='designers'),
    path('users/', UsersListView.as_view(), name='users'),
    path('role/', my_role, name='my-role'),
    path('become-designer/', become_designer, name='become-designer'),
    path('apply-designer/', apply_designer, name='apply-designer'),
    path('admin/applications/', AdminDesignerApplicationListView.as_view(), name='admin-applications'),
    path('applications/<int:application_id>/review/', review_designer_application, name='review-application'),
    path('bank-details/', bank_details, name='bank-details'),
    path('dashboard/', DesignerDashboardView.as_view(), name='designer-dashboard'),
    path('users/<int:user_id>/', manage_user, name='manage-user'),
    path('me/body-profile/', BodyProfileRetrieveUpdateView.as_view(), name='body-profile'),
    path('me/body-profile/measure/', BodyProfileMeasureView.as_view(), name='body-profile-measure'),
]
