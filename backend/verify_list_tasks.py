from ai_assistant.services import LLMService
from tasks.models import Task
from core.models import Organization, User
from django.utils import timezone
from datetime import timedelta

print("Testing LIST_TASKS Tool...")

# Setup
org = Organization.objects.get_or_create(name="Democorp")[0]
user = User.objects.filter(organization=org).first()
if not user:
    user = User.objects.create(username="list_tester", email="list@test.com", organization=org)

# Create a task due this month
now = timezone.now()
task = Task.objects.create(
    title="Tâche du mois",
    description="Doit apparaître",
    assigned_to=user,
    organization=org,
    due_date=now.date(),
    status='todo'
)

# Create a task due next month (should not appear)
next_month = now + timedelta(days=40)
task2 = Task.objects.create(
    title="Tâche future",
    description="Ne doit pas apparaître",
    assigned_to=user,
    organization=org,
    due_date=next_month.date(),
    status='todo'
)

# Simulate User Query
query = "Quelles sont mes tâches pour ce mois-ci ?"
print(f"\nUser Query: {query}")

llm = LLMService()

# 1. Detect Intent
intent = llm._detect_intent(query)
print(f"Detected Intent: {intent}")

if intent.get('tool') == 'LIST_TASKS':
    print("PASS: Correct tool selected.")
    params = intent.get('params', {})
    print(f"Params: {params}")
    
    # 2. Execute Tool
    result = llm._execute_tool('LIST_TASKS', params, query, user)
    print(f"\nTool Result:\n{result}")

    # Debug DB
    print("\n--- DB DEBUG ---")
    all_tasks = Task.objects.all()
    print(f"Total Tasks in DB: {all_tasks.count()}")
    for t in all_tasks:
        print(f"Task: {t.title}, Due: {t.due_date}, Status: {t.status}")
    
    if "Tâche du mois" in str(result) and "Tâche future" not in str(result):
        print("\nPASS: Correct tasks listed.")
    else:
        print("\nFAIL: Incorrect task list.")
else:
    print(f"FAIL: Wrong tool selected: {intent.get('tool')}")

# Cleanup
task.delete()
task2.delete()
