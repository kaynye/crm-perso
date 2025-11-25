from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .services import LLMService, RAGService

class ChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        messages = request.data.get('messages', [])
        if not messages:
            return Response({'error': 'No messages provided'}, status=400)

        # Get the last user message to use for RAG
        last_user_msg = next((m['content'] for m in reversed(messages) if m['role'] == 'user'), "")
        
        # Retrieve Context
        context = RAGService.get_context(last_user_msg)
        
        # Call LLM
        llm = LLMService()
        response_text = llm.chat(messages, context)
        
        return Response({
            'role': 'assistant',
            'content': response_text,
            'context_used': context # Optional: for debugging
        })
