from django.urls import path
from .views import ChatView, SummarizeView, UploadFileView, HistoryView, ConversationDetailView, TextCompletionView

urlpatterns = [
    path('chat/', ChatView.as_view(), name='chat'),
    path('summarize/', SummarizeView.as_view(), name='summarize'),
    path('upload/', UploadFileView.as_view(), name='upload'),
    path('history/', HistoryView.as_view(), name='chat-history'),
    path('history/<uuid:conversation_id>/', ConversationDetailView.as_view(), name='chat-conversation-detail'),
    path('completion/', TextCompletionView.as_view(), name='completion'),
]
