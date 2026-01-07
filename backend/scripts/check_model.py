import os
import sys
import django
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from ai_assistant.models import Conversation
print("Model loaded successfully.")
print(f"Fields: {[f.name for f in Conversation._meta.get_fields()]}")
