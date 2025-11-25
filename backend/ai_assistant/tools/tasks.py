from tasks.models import Task
from django.utils import timezone
import json
from django.contrib.auth import get_user_model

User = get_user_model()

class TaskTools:
    @staticmethod
    def create_task(title, description="", status="todo", priority="medium", due_date=None, assigned_to_username=None):
        """Creates a new task."""
        assigned_to = None
        if assigned_to_username:
            assigned_to = User.objects.filter(username__icontains=assigned_to_username).first()
            
        task = Task.objects.create(
            title=title,
            description=description,
            status=status,
            priority=priority,
            due_date=due_date,
            assigned_to=assigned_to
        )
        
        msg = f"Task '{title}' created."
        if assigned_to:
            msg += f" Assigned to {assigned_to.username}."
        return msg

    @staticmethod
    def extract_and_create_tasks(text, llm_service):
        """
        Uses LLM to extract tasks from text and creates them.
        """
        prompt = f"""
        Analyze the following text and extract actionable tasks.
        Return a JSON array of objects with keys: "title", "description", "priority" (low/medium/high), "status" (todo/in_progress).
        
        TEXT:
        {text}
        
        JSON OUTPUT ONLY:
        """
        
        messages = [{'role': 'user', 'content': prompt}]
        
        # We need to access the low-level chat method of the service
        # Assuming llm_service has a method to get raw response or we use the public chat
        # But public chat has RAG context injection which we don't need here.
        # We'll use the internal _chat_openai or _chat_gemini if accessible, or just chat with empty context.
        
        response_text = llm_service.chat(messages, context="", system_override="You are a task extraction engine. Output valid JSON only.")
        
        # Clean response (sometimes LLMs wrap in ```json ... ```)
        if "```" in response_text:
            response_text = response_text.split("```")[1].replace("json", "").strip()
            
        created_count = 0
        try:
            tasks_data = json.loads(response_text)
            if isinstance(tasks_data, list):
                for t in tasks_data:
                    Task.objects.create(
                        title=t.get('title', 'Untitled Task'),
                        description=t.get('description', ''),
                        priority=t.get('priority', 'medium'),
                        status=t.get('status', 'todo')
                    )
                    created_count += 1
            return f"Successfully extracted and created {created_count} tasks."
        except json.JSONDecodeError:
            return f"Failed to parse tasks from AI response. Raw output: {response_text[:100]}..."
