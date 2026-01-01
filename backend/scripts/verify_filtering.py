import os
import sys
import django
from pathlib import Path
import uuid

# Setup Django Environment
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from ai_assistant.vector_store import VectorStore

def verify_filtering():
    print("Verifying Metadata Filtering...")
    
    # Setup test data
    org_id_1 = str(uuid.uuid4())
    org_id_2 = str(uuid.uuid4())
    
    # Add two documents with same content but different orgs
    doc_1 = "Secret Project X data"
    doc_2 = "Secret Project X data"
    
    id_1 = f"test_doc_{uuid.uuid4()}"
    id_2 = f"test_doc_{uuid.uuid4()}"
    
    print("Adding test documents...")
    VectorStore.add_texts(
        texts=[doc_1, doc_2],
        metadatas=[{"organization_id": org_id_1}, {"organization_id": org_id_2}],
        ids=[id_1, id_2]
    )
    
    # Test 1: Search as Org 1
    print(f"\nTest 1: Search for 'Secret Project' as Org 1 ({org_id_1})")
    results = VectorStore.search("Secret Project", k=5, filter={"organization_id": org_id_1})
    
    ids_found = results['ids'][0]
    print(f"IDs found: {ids_found}")
    
    if id_1 in ids_found and id_2 not in ids_found:
        print("PASS: Only Org 1 document found.")
    else:
        print(f"FAIL: Leak detected or no results. Found: {ids_found}. Expected only {id_1}")

    # Cleanup
    print("\nCleaning up...")
    VectorStore.delete_texts([id_1, id_2])

if __name__ == '__main__':
    verify_filtering()
