import os
import sys
import django
import time
from pathlib import Path

# Setup Django Environment
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from ai_assistant.rag import RAGService
from django.contrib.auth import get_user_model

def verify_rerank():
    print("Verifying Reranking...")
    User = get_user_model()
    # Assume first user exists and has organization
    user = User.objects.first()
    if not user:
        print("No user found for test.")
        return

    query = "Project Alpha"
    print(f"Query: {query}")
    
    start = time.time()
    context = RAGService.get_context(query, user=user)
    end = time.time()
    
    print(f"\nContext Retrieved (in {end-start:.2f}s):")
    print("-" * 40)
    print(context[:500] + "..." if len(context) > 500 else context)
    print("-" * 40)
    
    if "(Score:" in context:
        print("PASS: Reranking scores detected in output.")
    else:
        print("FAIL: No reranking scores found (possibly fallback used).")

if __name__ == '__main__':
    verify_rerank()
