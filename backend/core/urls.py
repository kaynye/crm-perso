from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import CustomTokenObtainPairView, MentionSearchView, GlobalSearchView, DashboardView, UserViewSet, UploadView, NotificationViewSet, FcmTokenView

router = DefaultRouter()
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('auth/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/fcm-token/', FcmTokenView.as_view(), name='fcm_token'),
    path('search/mentions/', MentionSearchView.as_view(), name='mention_search'),
    path('search/global/', GlobalSearchView.as_view(), name='global_search'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('upload/', UploadView.as_view(), name='upload'),
    path('users/me/', UserViewSet.as_view({'get': 'me'}), name='user_me'),
    path('users/', UserViewSet.as_view({'get': 'list'}), name='user_list'),
    path('', include(router.urls)),
]
