
import os
import django
import sys

# Setup Django
sys.path.append('/Users/voumby/Documents/cms/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from ai_assistant.services import LLMService

def test_completion():
    print("Testing completion with 'improve'...")
    service = LLMService()
    # Mocking the actual LLM call to avoid cost/latency during simple test or rely on it working?
    # Let's try a real call if configured, otherwise we catch error.
    
    text = "hello world i am happy"
    try:
        result = service.completion(text, prompt_type="improve")
        print(f"Original: {text}")
        print(f"Result: {result}")
        if "Error" in result:
             print("FAILED: API Error")
        else:
             print("SUCCESS: Completion generated")
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    test_completion()
