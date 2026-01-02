import os
import sys
import django
import types
from pathlib import Path

# Setup Django Environment
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from ai_assistant.services import LLMService

def verify_citations():
    print("Verifying Citations Return...")
    llm = LLMService()
    
    # Use a query that triggers RAG
    query = "Montant contrat Suivie des dev"
    messages = [{'role': 'user', 'content': query}]
    
    # 1. Test LLMService.run_agent structure
    print("Running Agent...")
    result = llm.run_agent(messages, stream=False)
    
    if isinstance(result, dict) and 'sources' in result:
        print("PASS: run_agent returned dict with 'sources'.")
        sources = result['sources']
        print(f"Sources found: {len(sources)}")
        for s in sources:
            print(f" - [{s['type'].upper()}] {s['title']} (ID: {s['id']})")
            
        if len(sources) > 0:
            print("PASS: Sources list is populated.")
        else:
            print("WARN: Sources list is empty. (Maybe database empty or no match?)")
    else:
        print(f"FAIL: Result structure incorrect: {type(result)}")
        print(result)

if __name__ == '__main__':
    verify_citations()
