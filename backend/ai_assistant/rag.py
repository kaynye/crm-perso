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

        full_context = []
        seen_docs = set()
        
        # Optimization: Use the first query (which is likely the full text or most relevant part) 
        # for Hybrid Search as it benefits from natural language structure for vectors 
        # and keywords for full-text.
        # If 'queries' contains extracted entities, we might want to join them or just use the original query 
        # if we had access to it. Here 'queries' is passed from 'run_agent'.
        
        # Let's simple iterate but with higher confidence in the result.
        for query in queries:
            if len(query) < 2: continue
            
            try:
                # Filter by organization_id (Hybrid search in vector_store handles this internally or ignores for now, 
                # strictly speaking we should fix filter support in vector_store too if multi-tenant)
                # TODO: Pass filter to search_hybrid
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

        # Reranking using FlashRank
        try:
            from flashrank import Ranker, RerankRequest
            # Use a lightweight model. 'ms-marco-MiniLM-L-12-v2' is good but 'ms-marco-TinyBERT-L-2-v2' is faster.
            # Let's go with MiniLM for quality/speed balance.
            # Using cache_dir to avoid constant redownloads if stateless (though usually cached in /tmp or ~/.cache)
            ranker = Ranker(model_name="ms-marco-MiniLM-L-12-v2", cache_dir="./.model_cache")
            
            # Prepare passages
            passages = []
            # We need to map back to full_context construction logic.
            # Let's allow duplication in 'passages' list and rerank the string chunks directly?
            # FlashRank needs {"id":, "text":, "meta":}
            
            # Reconstruct structured data for reranking
            structured_docs = []
            
            # We already flattened results into 'full_context' list of strings.
            # Ideally we rerank BEFORE formatting.
            
            # Redoing the loop above nicely:
            passages_to_rank = []
            unique_passage_map = {} # id -> data
            
            for query in queries:
                 if len(query) < 2: continue
                 # Fetch more results for reranking
                 results = VectorStore.search(query, k=10, filter={"organization_id": str(user.organization.id)})
                 
                 docs = results['documents'][0]
                 metas = results['metadatas'][0]
                 ids = results['ids'][0]
                 
                 for i, text in enumerate(docs):
                     pid = ids[i]
                     if pid not in unique_passage_map:
                         unique_passage_map[pid] = {
                             "id": pid,
                             "text": text,
                             "meta": metas[i]
                         }
                         passages_to_rank.append({
                             "id": pid,
                             "text": text,
                             "meta": metas[i] # FlashRank might ignore this but good to keep
                         })
            
            if not passages_to_rank:
                 return "No specific database records found."

            # We assume the last query is the most relevant user intent for reranking
            rerank_query = queries[-1] 
            
            rerankrequest = RerankRequest(query=rerank_query, passages=passages_to_rank)
            results = ranker.rerank(rerankrequest)
            
            # Take Top 5
            top_results = results[:5]
            
            final_context = []
            for res in top_results:
                # res is dict with 'id', 'text', 'score', 'meta'
                # But flashrank output structure might vary slightly by version.
                # Usually it keeps input structure + score.
                
                # Retrieve original meta if needed
                pid = res['id']
                original = unique_passage_map.get(pid)
                meta = original['meta']
                
                source_type = meta.get('type', 'Unknown')
                source_name = meta.get('title', 'Unknown')
                
                final_context.append(f"[{source_type.upper()}] {source_name} (Score: {res['score']:.4f}):\n{res['text']}\n")
                
            return "\n".join(final_context)

        except ImportError:
            print("FlashRank not installed. Skipping reranking.")
            return "\n".join(full_context)
        except Exception as e:
            print(f"Reranking failed: {e}. Returning default results.")
            return "\n".join(full_context)
