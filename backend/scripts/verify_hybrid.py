import os
import sys
import django
from pathlib import Path

# Setup Django Environment
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from ai_assistant.vector_store import VectorStore

def verify_hybrid():
    print("Verifying Hybrid Search implementation...")
    
    # Test 1: Keyword-heavy search (e.g., a specific name that might be rare in training data)
    # Changed to "Project Alpha" as it exists in the current DB dump
    query_keyword = "Project Alpha" 
    print(f"\nTest 1: Keyword Search for '{query_keyword}'")
    results = VectorStore.search(query_keyword, k=2)
    print("Results:", results['documents'])
    
    if any("Project Alpha" in str(doc) for sublist in results['documents'] for doc in sublist):
        print("PASS: Found exact keyword match.")
    else:
        print("FAIL: Did not find exact keyword match.")

    # Test 2: Semantic search
    query_semantic = "agreement for business services"
    print(f"\nTest 2: Semantic Search for '{query_semantic}'")
    results = VectorStore.search(query_semantic, k=2)
    print("Results:", results['documents'])
    
    if len(results['documents']) > 0 and len(results['documents'][0]) > 0:
        print("PASS: Found semantic results.")
    else:
        print("FAIL: No semantic results.")

if __name__ == '__main__':
    verify_hybrid()
