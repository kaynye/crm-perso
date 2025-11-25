from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .services import LLMService

class ChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        messages = request.data.get('messages', [])
        if not messages:
            return Response({'error': 'No messages provided'}, status=400)

        # Get the last user message to use for RAG
        last_user_msg = next((m['content'] for m in reversed(messages) if m['role'] == 'user'), "")
        
        # Call LLM Agent (Handles Intent Detection -> Tool Execution OR RAG)
        llm = LLMService()
        response_text = llm.run_agent(messages)
        
        return Response({
            'role': 'assistant',
            'content': response_text
        })
