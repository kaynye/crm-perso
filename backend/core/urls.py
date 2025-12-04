from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import CustomTokenObtainPairView, MentionSearchView, GlobalSearchView, DashboardView, UserViewSet, UploadView

urlpatterns = [
    path('auth/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('search/mentions/', MentionSearchView.as_view(), name='mention_search'),
    path('search/global/', GlobalSearchView.as_view(), name='global_search'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('upload/', UploadView.as_view(), name='upload'),
    path('users/me/', UserViewSet.as_view({'get': 'me'}), name='user_me'),
    path('users/', UserViewSet.as_view({'get': 'list'}), name='user_list'),
]
