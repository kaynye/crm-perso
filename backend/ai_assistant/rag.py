import json
from django.db.models import Q
from pages.models import Page
from crm.models import Company, Contact, Contract, Meeting
from tasks.models import Task

class RAGService:
    @staticmethod
    def _parse_notes(notes_raw):
        """
        Parses Editor.js JSON and extracts plain text.
        """
        if not notes_raw: return ""
        try:
            data = json.loads(notes_raw)
            blocks = data.get('blocks', [])
            text_parts = []
            for block in blocks:
                text = block.get('data', {}).get('text', '')
                if text:
                    text_parts.append(text)
            return "\n".join(text_parts)
        except json.JSONDecodeError:
            return notes_raw

    @staticmethod
    def get_context(queries, user=None):
        """
        Retrieves relevant context using Vector Search (ChromaDB).
        """
        if isinstance(queries, str):
            queries = [queries]
            
        from .vector_store import VectorStore
        
        # Security check
        if not user or not user.organization:
             return "Error: User organization not found for context retrieval."

        # Combine queries into a single search string for better semantic context
        # or search individually. Let's search individually and aggregate.
        
        full_context = []
        seen_docs = set()

        for query in queries:
            if len(query) < 2: continue
            
            try:
                # Filter by organization_id
                results = VectorStore.search(
                    query, 
                    k=5, 
                    filter={"organization_id": str(user.organization.id)}
                )
                
                # Chroma returns: {'ids': [['id1', 'id2']], 'documents': [['doc1', 'doc2']], 'metadatas': [[{'source': '...'}, ...]]}
                documents = results['documents'][0]
                metadatas = results['metadatas'][0]
                ids = results['ids'][0]
                
                for i, doc in enumerate(documents):
                    doc_id = ids[i]
                    if doc_id in seen_docs: continue
                    seen_docs.add(doc_id)
                    
                    meta = metadatas[i]
                    source_type = meta.get('type', 'Unknown')
                    source_name = meta.get('title', 'Unknown')
                    
                    full_context.append(f"[{source_type.upper()}] {source_name}:\n{doc}\n")
            except Exception as e:
                print(f"Vector Search Error: {e}")
                # Fallback or just continue
                continue

        if not full_context:
            return "No specific database records found for these queries."
            
        return "\n".join(full_context)
