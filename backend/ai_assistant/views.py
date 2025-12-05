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
        
        # Call LLM Agent
        llm = LLMService()
        page_context = request.data.get('context', {})
        agent_response = llm.run_agent(messages, page_context=page_context, user=request.user)
        
        # agent_response is now a dict { "content": "...", "action": ... }
        return Response({
            'role': 'assistant',
            'content': agent_response.get('content', ''),
            'action': agent_response.get('action', None)
        })

class SummarizeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        text = request.data.get('text', '')
        if not text:
            return Response({'error': 'No text provided'}, status=400)

        llm = LLMService()
        summary = llm.summarize_text(text)
        
        return Response({'summary': summary})
