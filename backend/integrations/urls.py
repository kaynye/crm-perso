from django.urls import path
from .views import GoogleAuthView, GoogleCallbackView, GithubAuthView, GithubCallbackView, GithubDataView, GithubWebhookView

urlpatterns = [
    path('google/login/', GoogleAuthView.as_view(), name='google_login'),
    path('google/callback/', GoogleCallbackView.as_view(), name='google_callback'),
    path('github/login/', GithubAuthView.as_view(), name='github_login'),
    path('github/callback/', GithubCallbackView.as_view(), name='github_callback'),
    path('github/data/', GithubDataView.as_view(), name='github_data'),
    path('github/webhook/', GithubWebhookView.as_view(), name='github_webhook'),
]
