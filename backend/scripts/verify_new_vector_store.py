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

def verify():
    print("Verifying VectorStore implementation...")
    
    # query
    results = VectorStore.search("contract", k=1)
    print("Search results for 'contract':")
    print(results)
    
    if results and len(results['documents']) > 0 and len(results['documents'][0]) > 0:
        print("PASS: Search returned results.")
    else:
        print("FAIL: Search returned empty.")

if __name__ == '__main__':
    verify()
