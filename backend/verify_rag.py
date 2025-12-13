from ai_assistant.vector_store import VectorStore

print("Testing Vector Search...")
try:
    results = VectorStore.search("contrat", k=3)
    print(f"Results found: {len(results['documents'][0])}")
    for i, doc in enumerate(results['documents'][0]):
        meta = results['metadatas'][0][i]
        print(f"[{meta.get('type')}] {meta.get('title')}: {doc[:50]}...")
except Exception as e:
    print(f"Search failed: {e}")
