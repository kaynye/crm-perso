from tasks.models import Task
from crm.models import Company
from core.models import Organization, User
from ai_assistant.vector_store import VectorStore
import time

print("Testing Real-time RAG Indexing...")

# Setup
org = Organization.objects.get_or_create(name="Democorp")[0]
user = User.objects.filter(organization=org).first()
if not user:
    user = User.objects.create(username="rag_tester", email="rag@test.com", organization=org)

company = Company.objects.create(name="SpaceX", industry="Aerospace", organization=org)

# 1. Create Task
print("\n1. Creating Task 'Buy a spaceship'...")
task = Task.objects.create(
    title="Buy a spaceship",
    description="Need to go to Mars",
    assigned_to=user,
    organization=org,
    company=company
)

# Wait a moment for signal (synchronous but good practice)
time.sleep(1)

# 2. Search
print("Searching for 'spaceship'...")
results = VectorStore.search("spaceship", k=1)
if results['documents'][0] and "spaceship" in results['documents'][0][0]:
    print("PASS: Found task via vector search!")
else:
    print(f"FAIL: Task not found. Results: {results}")

# 3. Update Task
print("\n3. Updating Task to 'Buy a bicycle'...")
task.title = "Buy a bicycle"
task.description = "Eco-friendly transport"
task.save()
time.sleep(1)

# 4. Search again
print("Searching for 'bicycle'...")
results = VectorStore.search("bicycle", k=1)
if results['documents'][0] and "bicycle" in results['documents'][0][0]:
    print("PASS: Found updated task!")
else:
    print(f"FAIL: Updated task not found.")

print("Searching for 'spaceship' (should fail)...")
results = VectorStore.search("spaceship", k=1)
# Note: It might still find it if k=1 returns the closest match even if low score, 
# but the content should be the new one.
if results['documents'][0]:
    print(f"Result content: {results['documents'][0][0][:50]}...")
    if "spaceship" not in results['documents'][0][0]:
        print("PASS: Old content gone.")
    else:
        print("FAIL: Old content still present.")

# 5. Delete Task
print("\n5. Deleting Task...")
task.delete()
time.sleep(1)

print("Searching for 'bicycle' (should fail)...")
results = VectorStore.search("bicycle", k=1)
if not results['documents'][0] or "bicycle" not in results['documents'][0][0]:
    print("PASS: Task deleted from index.")
else:
    print(f"FAIL: Task still in index: {results['documents'][0][0][:50]}...")

# Cleanup
company.delete()
if user.username == "rag_tester":
    user.delete()
