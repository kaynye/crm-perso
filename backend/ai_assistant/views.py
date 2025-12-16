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
        return Response({'summary': summary})

class UploadFileView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file provided'}, status=400)
            
        # Save temp file
        import os
        from django.conf import settings
        from django.core.files.storage import default_storage
        from django.core.files.base import ContentFile
        
        # We'll save it to a temp directory or just default storage 
        # and return the absolute path/ID.
        # For simplicity, let's use a hashed name in MEDIA_ROOT
        
        path = default_storage.save(f"uploads/{file_obj.name}", ContentFile(file_obj.read()))
        full_path = os.path.join(settings.MEDIA_ROOT, path)
        
        return Response({
            'file_id': path, # Relative path effectively
            'full_path': full_path,
            'message': 'File uploaded successfully'
        })
