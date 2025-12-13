from ai_assistant.services import LLMService
from ai_assistant.rag import RAGService
from tasks.models import Task
from core.models import Organization, User
import time

print("Testing Semantic RAG Capabilities...")

# Setup
org = Organization.objects.get_or_create(name="Democorp")[0]
user = User.objects.filter(organization=org).first()
if not user:
    user = User.objects.create(username="rag_tester", email="rag@test.com", organization=org)

# 1. Create Task with specific concept
print("\n1. Creating Task 'Réparer la machine à café'...")
task = Task.objects.create(
    title="Réparer la machine à café",
    description="Urgent, l'équipe s'endort.",
    assigned_to=user,
    organization=org
)
# Wait for signal
time.sleep(1)

# 2. Simulate User Query using a related concept (not exact word)
query = "Je veux une boisson chaude" 
print(f"\nUser Query: {query}")

# 3. Extract Entities
llm = LLMService()
entities = llm.extract_entities(query)
print(f"Extracted Entities: {entities}")

# 4. Retrieve Context
print("Retrieving Context via Vector Store...")
context = RAGService.get_context(entities)
print(f"\n--- RETRIEVED CONTEXT ---\n{context}\n-------------------------")

# 5. Verify
if "machine à café" in context:
    print("\nPASS: Semantic match found! ('boisson chaude' -> 'machine à café')")
else:
    print("\nFAIL: Semantic match failed.")

# Cleanup
task.delete()
