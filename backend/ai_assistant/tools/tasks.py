from tasks.models import Task
from django.utils import timezone
from datetime import timedelta
import json
from django.contrib.auth import get_user_model

User = get_user_model()

class TaskTools:
    @staticmethod
    def create_task(title, description="", status="todo", priority="medium", due_date=None, assigned_to_username=None, user=None):
        """Creates a new task."""
        assigned_to = None
        if assigned_to_username:
            assigned_to = User.objects.filter(username__icontains=assigned_to_username).first()
            
        # Sanitize due_date
        if due_date == "":
            due_date = None
            
        if not user or not hasattr(user, 'organization'):
            return "Erreur: Impossible de déterminer l'organisation. Utilisateur non authentifié."

        task = Task.objects.create(
            title=title,
            description=description,
            status=status,
            priority=priority,
            due_date=due_date,
            assigned_to=assigned_to,
            organization=user.organization
        )
        return {
            "message": f"Tâche '{title}' créée avec succès.",
            "action": {
                "type": "NAVIGATE",
                "label": "Voir les tâches",
                "url": "/tasks"
            }
        }

    @staticmethod
    def extract_and_create_tasks(text, llm_service, user=None):
        """
        Uses LLM to extract tasks from text and creates them.
        """
        if not user or not hasattr(user, 'organization'):
            return "Erreur: Impossible de déterminer l'organisation. Utilisateur non authentifié."

        now = timezone.localtime()
        prompt = f"""
        You are a Task Generator.
        Current Date: {now.strftime('%Y-%m-%d')}
        
        Instruction: Analyze the text and generate a list of tasks.
        - If the text describes specific tasks, extract them.
        - If the text asks to generate tasks for a schedule (e.g. "every day next week", "daily sport"), GENERATE separate tasks for each required day.
        - Calculate specific "due_date" (YYYY-MM-DD) for each task based on the Current Date.
        
        Input Text:
        {text}
        
        Output: JSON array of objects with keys: 
        - "title"
        - "description"
        - "priority" (low/medium/high)
        - "status" (todo/in_progress)
        - "due_date" (YYYY-MM-DD)
        """
        
        messages = [{'role': 'user', 'content': prompt}]
        
        # We need to access the low-level chat method of the service
        # Assuming llm_service has a method to get raw response or we use the public chat
        # But public chat has RAG context injection which we don't need here.
        # We'll use the internal _chat_openai or _chat_gemini if accessible, or just chat with empty context.
        
        response_text = llm_service.chat(messages, context="", system_override="You are a task generator. Output valid JSON only.")
        
        # Clean response (sometimes LLMs wrap in ```json ... ```)
        if "```" in response_text:
            response_text = response_text.split("```")[1].replace("json", "").strip()
            
        created_count = 0
        try:
            tasks_data = json.loads(response_text)
            if isinstance(tasks_data, list):
                for t in tasks_data:
                    # Handle due_date
                    due_date = t.get('due_date')
                    if due_date:
                        # Ensure it's just a date or datetime
                        # The model might return YYYY-MM-DD
                        pass 
                        
                    Task.objects.create(
                        title=t.get('title', 'Untitled Task'),
                        description=t.get('description', ''),
                        priority=t.get('priority', 'medium'),
                        status=t.get('status', 'todo'),
                        due_date=due_date,
                        organization=user.organization
                    )
                    created_count += 1
            return f"Génération réussie : {created_count} tâches créées."
        except json.JSONDecodeError:
            return f"Échec de l'analyse des tâches depuis la réponse IA. Sortie brute : {response_text[:100]}..."

    @staticmethod
    def list_tasks(status=None, priority=None, due_date_range=None, limit=5):
        """
        Lists tasks based on filters.
        due_date_range: 'today', 'this_week', 'this_month', 'overdue'
        """
        tasks = Task.objects.all().order_by('due_date')
        
        if status:
            tasks = tasks.filter(status=status)
        else:
            # Default to not showing finished tasks unless asked
            tasks = tasks.exclude(status='done')
            
        if priority:
            tasks = tasks.filter(priority=priority)
            
        now = timezone.now()
        if due_date_range == 'today':
            start_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end_day = now.replace(hour=23, minute=59, second=59, microsecond=999999)
            tasks = tasks.filter(due_date__range=[start_day, end_day])
        elif due_date_range == 'this_week':
            start_week = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
            end_week = (start_week + timedelta(days=6)).replace(hour=23, minute=59, second=59, microsecond=999999)
            tasks = tasks.filter(due_date__range=[start_week, end_week])
        elif due_date_range == 'this_month':
            import calendar
            last_day = calendar.monthrange(now.year, now.month)[1]
            # Create aware datetimes for start and end of month
            start_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            end_month = now.replace(day=last_day, hour=23, minute=59, second=59, microsecond=999999)
            end_month = now.replace(day=last_day, hour=23, minute=59, second=59, microsecond=999999)
            tasks = tasks.filter(due_date__range=[start_month, end_month])
        elif due_date_range == 'last_month':
            import calendar
            # Calculate first day of this month, then subtract 1 day to get last month
            first_of_this_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            last_of_last_month = first_of_this_month - timedelta(microseconds=1)
            first_of_last_month = last_of_last_month.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            tasks = tasks.filter(due_date__range=[first_of_last_month, last_of_last_month])
        elif due_date_range == 'overdue':
            tasks = tasks.filter(due_date__lt=now)
            
        count = tasks.count()
        if count == 0:
            return "Aucune tâche trouvée pour ces critères."
            
        tasks = tasks[:limit]
        task_list = []
        for t in tasks:
            assigned = t.assigned_to.username if t.assigned_to else "Personne"
            date_str = t.due_date.strftime('%d/%m/%Y') if t.due_date else "Aucune date"
            task_list.append(f"- {t.title} (Statut: {t.status}, Priorité: {t.priority}, Pour: {assigned}, Échéance: {date_str})")
            
        return f"Voici les tâches trouvées ({count} total) :\n" + "\n".join(task_list)
