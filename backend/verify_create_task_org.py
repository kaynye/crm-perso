from ai_assistant.tools.tasks import TaskTools
from core.models import Organization, User
from tasks.models import Task

print("Testing CREATE_TASK with Organization...")

# Setup
org = Organization.objects.get_or_create(name="Democorp")[0]
user = User.objects.filter(organization=org).first()
if not user:
    user = User.objects.create(username="org_tester", email="org@test.com", organization=org)

# Test create_task
print("\nCreating task via TaskTools...")
task = None
try:
    result = TaskTools.create_task(
        title="Task with Org",
        description="Should work",
        user=user
    )
    print(f"Result: {result}")
    
    # Verify in DB
    task = Task.objects.filter(title="Task with Org").first()
    if task and task.organization == org:
        print("PASS: Task created with correct organization.")
    else:
        print(f"FAIL: Task not found or wrong org. Task: {task}, Org: {task.organization if task else 'None'}")
        
except Exception as e:
    print(f"FAIL: Exception occurred: {e}")

# Cleanup
if task:
    task.delete()
