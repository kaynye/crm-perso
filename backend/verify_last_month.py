from ai_assistant.tools.tasks import TaskTools
from tasks.models import Task
from core.models import Organization, User
from django.utils import timezone
from datetime import timedelta

print("Testing LIST_TASKS (last_month)...")

# Setup
org = Organization.objects.get_or_create(name="Democorp")[0]
user = User.objects.filter(organization=org).first()
if not user:
    user = User.objects.create(username="list_tester", email="list@test.com", organization=org)

now = timezone.now()
# Create task last month
first_of_this_month = now.replace(day=1)
last_month_date = first_of_this_month - timedelta(days=5) # 5 days before start of this month

task = Task.objects.create(
    title="Tâche mois dernier",
    description="Doit apparaître",
    assigned_to=user,
    organization=org,
    due_date=last_month_date,
    status='done'
)

print(f"Created task due: {last_month_date}")

# Test direct tool call
result = TaskTools.list_tasks(due_date_range='last_month', status='done')
print(f"\nTool Result:\n{result}")

if "Tâche mois dernier" in str(result):
    print("\nPASS: Found task from last month.")
else:
    print("\nFAIL: Task not found.")

# Cleanup
task.delete()
