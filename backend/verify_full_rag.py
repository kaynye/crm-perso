from ai_assistant.services import LLMService
from ai_assistant.rag import RAGService
import time

print("Testing Full RAG Pipeline...")

# 1. Simulate User Query
query = "Qu'est-ce qu'on a dit sur le vélo ?" # Should match "bicycle" task
print(f"\nUser Query: {query}")

# 2. Extract Entities (LLM)
llm = LLMService()
print("Extracting entities...")
entities = llm.extract_entities(query)
print(f"Extracted Entities: {entities}")

# 3. Retrieve Context (Vector Search)
print("Retrieving Context via RAGService (Vector Store)...")
context = RAGService.get_context(entities)
print(f"\n--- RETRIEVED CONTEXT ---\n{context}\n-------------------------")

# 4. Check if context contains expected data
if "bicycle" in context.lower():
    print("\nPASS: Context contains 'bicycle' from Vector Store.")
else:
    print("\nFAIL: Context does not contain 'bicycle'.")
