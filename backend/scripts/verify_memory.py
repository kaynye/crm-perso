import os
import sys
import django
from pathlib import Path

# Setup Django Environment
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from ai_assistant.models import Conversation, Message
from ai_assistant.services import LLMService
from core.models import User

def verify_memory():
    print("Verifying Memory/Summarization...")
    
    # 1. Setup User and Conversation
    u = User.objects.first()
    if not u:
        print("FAIL: No user found.")
        return

    c = Conversation.objects.create(user=u, title="Memory Test")
    print(f"Created Conversation: {c.id}")
    
    # 2. Seed Messages
    print("Seeding messages...")
    msgs = [
        ("user", "J'ai besoin de créer une entreprise appelée 'SpaceX'."),
        ("assistant", "D'accord, je note."),
        ("user", "Son CEO est Elon Musk."),
        ("assistant", "Noté."),
        ("user", "Elle est basée au Texas."),
        ("assistant", "C'est enregistré."),
        ("user", "Quels sont les détails ?"),
        ("assistant", "SpaceX, CEO Elon Musk, Texas."),
        ("user", "Ajoute un contrat de 5M."),
        ("assistant", "Contrat ajouté."),
    ]
    
    for role, content in msgs:
        Message.objects.create(conversation=c, role=role, content=content)
        
    # 3. Trigger Summarization
    print("Triggering Summarization...")
    llm = LLMService()
    summary = llm.summarize_conversation(c.id)
    
    if summary:
        print("PASS: Summary generated.")
        print("-" * 20)
        print(summary)
        print("-" * 20)
        
        # Verify DB
        c.refresh_from_db()
        if c.summary == summary:
            print("PASS: Summary saved to DB.")
        else:
            print("FAIL: Summary not saved to DB.")
    else:
        print("FAIL: Summarization returned None.")

if __name__ == '__main__':
    verify_memory()
