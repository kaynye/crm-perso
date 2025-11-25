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
        
        # Call LLM to extract search terms
        llm = LLMService()
        search_terms = llm.extract_entities(last_user_msg)
        
        # Retrieve Context using extracted terms
        context = RAGService.get_context(search_terms)
        
        # Call LLM for final response
        response_text = llm.chat(messages, context)
        
        return Response({
            'role': 'assistant',
            'content': response_text,
            'context_used': context # Optional: for debugging
        })
