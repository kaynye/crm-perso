
import os
import django
import sys
from pathlib import Path

# Setup Django environment
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from crm.models import Document
from crm.serializers import DocumentSerializer
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

factory = APIRequestFactory()
request = factory.get('/')

doc = Document.objects.last()
if doc:
    # Print the file URL directly from model
    print(f"Model URL: {doc.file.url}")
    
    # Print serialized data
    serializer = DocumentSerializer(doc, context={'request': request})
    print(f"Serialized 'file': {serializer.data['file']}")
else:
    print("No documents found.")
