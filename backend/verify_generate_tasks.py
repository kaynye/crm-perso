from ai_assistant.services import LLMService
from tasks.models import Task
from core.models import Organization, User
from django.utils import timezone
from datetime import timedelta

print("Testing Task Generation...")

# Setup
org = Organization.objects.get_or_create(name="Democorp")[0]
user = User.objects.filter(organization=org).first()
if not user:
    user = User.objects.create(username="gen_tester", email="gen@test.com", organization=org)

# Simulate User Query
query = "Créer une tâche de sport pour chaque jour de la semaine prochaine."
print(f"\nUser Query: {query}")

llm = LLMService()

# 1. Detect Intent
intent = llm._detect_intent(query)
print(f"Detected Intent: {intent}")

if intent.get('tool') == 'EXTRACT_TASKS':
    print("PASS: Correct tool selected (EXTRACT_TASKS used for generation).")
    params = intent.get('params', {})
    
    # 2. Execute Tool
    result = llm._execute_tool('EXTRACT_TASKS', params, query, user)
    print(f"\nTool Result:\n{result}")
    
    # Verify DB
    # Check for tasks created in the last few seconds
    now = timezone.now()
    tasks = Task.objects.filter(organization=org, created_at__gte=now - timedelta(seconds=10)).order_by('due_date')
    
    print(f"\nCreated {tasks.count()} tasks:")
    for t in tasks:
        print(f"- {t.title} (Due: {t.due_date})")
        
    if tasks.count() >= 5:
        print("\nPASS: Multiple tasks created.")
        # Check dates
        first_due = tasks.first().due_date
        if first_due and first_due.date() > now.date():
             print("PASS: Tasks are in the future (next week).")
        else:
             print(f"FAIL: Dates might be wrong. First due: {first_due}")
    else:
        print("\nFAIL: Not enough tasks created.")

else:
    print(f"FAIL: Wrong tool selected: {intent.get('tool')}")

# Cleanup
# tasks.delete()
