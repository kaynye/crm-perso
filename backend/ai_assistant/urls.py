from django.urls import path
from .views import ChatView, SummarizeView, UploadFileView

urlpatterns = [
    path('chat/', ChatView.as_view(), name='chat'),
    path('summarize/', SummarizeView.as_view(), name='summarize'),
    path('upload/', UploadFileView.as_view(), name='upload'),
]
