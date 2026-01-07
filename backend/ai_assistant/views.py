from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import StreamingHttpResponse
from .services import LLMService
import types

from .models import Conversation, Message

class ChatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        messages = request.data.get('messages', [])
        conversation_id = request.data.get('conversation_id')
        
        if not messages:
            return Response({'error': 'No messages provided'}, status=400)

        # 1. Get or Create Conversation
        if conversation_id:
            try:
                conversation = Conversation.objects.get(id=conversation_id, user=request.user)
            except Conversation.DoesNotExist:
                return Response({'error': 'Conversation not found'}, status=404)
        else:
            conversation = Conversation.objects.create(user=request.user)
            # Optional: Set title based on first message
            user_msg_content = next((m['content'] for m in reversed(messages) if m['role'] == 'user'), "New Chat")
            conversation.title = user_msg_content[:50]
            conversation.save()

        # 2. Save User Message to DB (if it's the last one)
        last_msg = messages[-1]
        if last_msg['role'] == 'user':
             Message.objects.create(
                 conversation=conversation,
                 role='user',
                 content=last_msg['content']
             )

        # Call LLM Agent
        llm = LLMService()
        page_context = request.data.get('context', {})
        
        # Pass existing summary
        summary = conversation.summary
        
        # Enable streaming
        agent_output = llm.run_agent(messages, page_context=page_context, user=request.user, stream=True, summary=summary)
        
        # Background Summarization Trigger (every 10 messages)
        # We check roughly the length of messages list sent by frontend to avoid DB counts
        if len(messages) > 0 and len(messages) % 10 == 0:
             import threading
             def run_summary_bg(cid):
                 # Re-instantiate service inside thread to avoid shared state issues if any
                 svc = LLMService() 
                 svc.summarize_conversation(cid)
             
             t = threading.Thread(target=run_summary_bg, args=(str(conversation.id),))
             t.start()
        
        # Determine output type
        # New run_agent returns dict with 'response' key for chat
        if isinstance(agent_output, dict) and 'response' in agent_output:
            response_obj = agent_output['response']
            sources = agent_output.get('sources', [])
            
            # Streaming Chat
            if isinstance(response_obj, types.GeneratorType):
                def stream_and_save():
                    full_content = ""
                    for chunk in response_obj:
                        full_content += chunk
                        yield chunk
                    
                    # After stream ends, save to DB
                    Message.objects.create(
                        conversation=conversation,
                        role='assistant',
                        content=full_content,
                        sources=sources
                    )
                
                response = StreamingHttpResponse(stream_and_save(), content_type='text/plain')
                response['X-Conversation-ID'] = str(conversation.id)
                # Pass sources in header (JSON encoded)
                import json
                try:
                    response['X-Sources'] = json.dumps(sources)
                except:
                    pass
                return response
            else:
                # Non-streaming Chat (fallback)
                content = str(response_obj)
                Message.objects.create(
                    conversation=conversation,
                    role='assistant',
                    content=content,
                    sources=sources
                )
                return Response({
                    'conversation_id': str(conversation.id),
                    'role': 'assistant',
                    'content': content,
                    'sources': sources
                })
        
        # Tool Execution Result (Direct Dict from Tool)
        elif isinstance(agent_output, dict):
             
             # If the output IS the action (e.g. Generated Chart or Navigate), use it directly
             # If it wraps an action (e.g. {'content': 'Done', 'action': {...}}), use that
             
             final_content = agent_output.get('content', '')
             final_action = agent_output.get('action')
             
             if not final_action and 'type' in agent_output and agent_output['type'] in ['UI_CHART', 'NAVIGATE', 'CHOICES']:
                 final_action = agent_output
                 
             # Save to DB
             Message.objects.create(
                 conversation=conversation,
                 role='assistant',
                 content=final_content,
                 action=final_action,
             )
             return Response({
                'conversation_id': str(conversation.id),
                'role': 'assistant',
                'content': final_content,
                'action': final_action
             })

        # Fallback (Should not happen with current logic)
        return Response({'error': 'Unexpected agent output'}, status=500)

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

class HistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        conversations = Conversation.objects.filter(user=request.user).order_by('-updated_at')
        data = []
        for c in conversations:
            data.append({
                'id': str(c.id),
                'title': c.title or 'Nouvelle conversation',
                'created_at': c.created_at,
                'updated_at': c.updated_at
            })
        return Response(data)

class ConversationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, conversation_id):
        try:
            conversation = Conversation.objects.get(id=conversation_id, user=request.user)
        except Conversation.DoesNotExist:
            return Response({'error': 'Conversation not found'}, status=404)
        
        messages = conversation.messages.all()
        data = []
        for m in messages:
            data.append({
                'role': m.role,
                'content': m.content,
                'action': m.action,
                'sources': m.sources,
                'created_at': m.created_at
            })
        return Response(data)

    def delete(self, request, conversation_id):
        try:
             conversation = Conversation.objects.get(id=conversation_id, user=request.user)
             conversation.delete()
             return Response({'message': 'Conversation deleted'})
        except Conversation.DoesNotExist:
             return Response({'error': 'Conversation not found'}, status=404)
             return Response({'error': 'Conversation not found'}, status=404)

class TextCompletionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        text = request.data.get('text', '')
        prompt_type = request.data.get('type', 'improve') # improve, shorter, longer, fix, zap
        custom_prompt = request.data.get('prompt', '')
        
        if not text:
            return Response({'error': 'No text provided'}, status=400)

        llm = LLMService()
        completion = llm.completion(text, prompt_type, custom_prompt)
        
        return Response({
            'completion': completion,
            'original': text
        })
