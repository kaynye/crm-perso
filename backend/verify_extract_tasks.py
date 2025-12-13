from ai_assistant.services import LLMService
from tasks.models import Task
from core.models import Organization, User

print("Testing EXTRACT_TASKS Tool...")

# Setup
org = Organization.objects.get_or_create(name="Democorp")[0]
user = User.objects.filter(organization=org).first()
if not user:
    user = User.objects.create(username="extract_tester", email="extract@test.com", organization=org)

# Simulate User Query
query = "Créer moi des taches pour la semaine : Lundi sport, Mardi lecture, Mercredi code."
print(f"\nUser Query: {query}")

llm = LLMService()

# 1. Detect Intent
intent = llm._detect_intent(query)
print(f"Detected Intent: {intent}")

if intent.get('tool') == 'EXTRACT_TASKS':
    print("PASS: Correct tool selected.")
    params = intent.get('params', {})
    print(f"Params: {params}")
    
    # 2. Execute Tool
    result = llm._execute_tool('EXTRACT_TASKS', params, query, user)
    print(f"\nTool Result:\n{result}")
    
    # Verify DB
    tasks = Task.objects.filter(organization=org).order_by('-created_at')[:3]
    titles = [t.title for t in tasks]
    print(f"Created Tasks: {titles}")
    
    if any("sport" in t.lower() for t in titles) and any("code" in t.lower() for t in titles):
        print("\nPASS: Tasks created successfully.")
    else:
        print("\nFAIL: Tasks not created as expected.")
else:
    print(f"FAIL: Wrong tool selected: {intent.get('tool')}")
    # Fallback check if it tried CREATE_TASK multiple times (not supported by current architecture)

# Cleanup
# (Optional, keeping them might be useful for manual check)
