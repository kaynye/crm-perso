from django.urls import path
from .views import GoogleAuthView, GoogleCallbackView

urlpatterns = [
    path('google/login/', GoogleAuthView.as_view(), name='google_login'),
    path('google/callback/', GoogleCallbackView.as_view(), name='google_callback'),
]
