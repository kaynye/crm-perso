import json
from django.conf import settings
from django.db import connections
from chromadb.utils import embedding_functions

class VectorStore:
    _embedding_function = None

    @classmethod
    def get_embedding_function(cls):
        if cls._embedding_function is None:
            # Use OpenAI embedding function
            # Start with 'text-embedding-3-small' (1536 dims)
            # User uses a specific env var for this key
            openai_key = settings.OPENIA_API_KEY_CMS_PERSO
            
            if openai_key:
                try:
                     cls._embedding_function = embedding_functions.OpenAIEmbeddingFunction(
                        api_key=openai_key,
                        model_name="text-embedding-3-small"
                    )
                except Exception as e:
                    print(f"Error initializing OpenAI Embedding Function: {e}")
                    # Fallback or re-raise? Re-raising might crash app startup if called early.
                    # But failing silently leads to default model usage which breaks dimensions.
                    # Let's try to proceed, if it fails, reindexing will catch it.
            
            if cls._embedding_function is None:
                # Fallback (schema mismatch risk if not 1536)
                print("WARNING: No valid OpenAI API Key found (OPENIA_API_KEY_CMS_PERSO). Fallback to local default.")
                cls._embedding_function = embedding_functions.DefaultEmbeddingFunction()
        return cls._embedding_function

    @classmethod
    def _get_connection(cls):
        return connections['vector_db']

    @classmethod
    def add_texts(cls, texts, metadatas, ids):
        """
        Adds texts to the vector store.
        """
        ef = cls.get_embedding_function()
        embeddings = ef(texts)
        
        with cls._get_connection().cursor() as cursor:
            for i, text in enumerate(texts):
                embedding = embeddings[i]
                # Convert numpy array to list for proper string formatting
                if hasattr(embedding, 'tolist'):
                    embedding = embedding.tolist()
                
                metadata = metadatas[i] if metadatas else {}
                doc_id = ids[i]
                
                cursor.execute("""
                    INSERT INTO cms_rag_vectors (id, embedding, document, metadata)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE 
                    SET embedding = EXCLUDED.embedding,
                        document = EXCLUDED.document,
                        metadata = EXCLUDED.metadata;
                """, (doc_id, str(embedding), text, json.dumps(metadata)))

    @classmethod
    def search(cls, query, k=5, filter=None):
        return cls.search_hybrid(query, k=k, filter=filter)

    @classmethod
    def search_hybrid(cls, query, k=5, filter=None):
        """
        Performs Hybrid Search (Vector + Full-Text) using RRF (Reciprocal Rank Fusion).
        """
        ef = cls.get_embedding_function()
        query_embedding = ef([query])[0]
        
        # Convert numpy array to list
        if hasattr(query_embedding, 'tolist'):
            query_embedding = query_embedding.tolist()

        with cls._get_connection().cursor() as cursor:
            # 1. Semantic Search (Vector) - Top k*2
            vector_sql = """
                SELECT id, document, metadata, 1.0 / (ROW_NUMBER() OVER (ORDER BY embedding <-> %s) + 60) as score
                FROM cms_rag_vectors
                WHERE 1=1
            """
            params_vec = [str(query_embedding)]
            
            if filter:
                # Assuming simple key-value equality filter for now
                # Example: filter={'organization_id': '123'}
                for key, value in filter.items():
                    vector_sql += f" AND metadata->>'{key}' = %s"
                    params_vec.append(str(value)) # Ensure value is string for ->> comparison safely
            
            vector_sql += " ORDER BY embedding <-> %s LIMIT %s;"
            params_vec.append(str(query_embedding))
            params_vec.append(k * 2)
            
            cursor.execute(vector_sql, params_vec)
            vector_results = cursor.fetchall()

            # 2. Keyword Search (Full-Text) - Top k*2
            keyword_sql = """
                SELECT id, document, metadata, 1.0 / (ROW_NUMBER() OVER (ORDER BY ts_rank(to_tsvector('french', document), websearch_to_tsquery('french', %s)) DESC) + 60) as score
                FROM cms_rag_vectors
                WHERE to_tsvector('french', document) @@ websearch_to_tsquery('french', %s)
            """
            params_kw = [query, query] # for rank and where clause base
            
            if filter:
                 for key, value in filter.items():
                    keyword_sql += f" AND metadata->>'{key}' = %s"
                    params_kw.append(str(value))

            keyword_sql += " ORDER BY ts_rank(to_tsvector('french', document), websearch_to_tsquery('french', %s)) DESC LIMIT %s;"
            params_kw.append(query)
            params_kw.append(k * 2)

            cursor.execute(keyword_sql, params_kw)
            keyword_results = cursor.fetchall()
            
            # 3. RRF Fusion
            combined_scores = {}
            docs_map = {}
            metas_map = {}
            
            # Helper to merge
            def merge_results(results):
                for row in results:
                    doc_id, doc, meta, score = row
                    if doc_id not in combined_scores:
                        combined_scores[doc_id] = 0
                        docs_map[doc_id] = doc
                        metas_map[doc_id] = meta
                    combined_scores[doc_id] += score

            merge_results(vector_results)
            merge_results(keyword_results)
            
            # Sort by fused score
            sorted_ids = sorted(combined_scores, key=combined_scores.get, reverse=True)[:k]
            
            final_documents = []
            final_metadatas = []
            final_ids = []
            final_distances = [] # We return RRF score as "distance" (higher is better though, so careful with interpretation)
            
            for doc_id in sorted_ids:
                final_ids.append(doc_id)
                final_documents.append(docs_map[doc_id])
                meta = metas_map[doc_id]
                final_metadatas.append(meta if isinstance(meta, dict) else json.loads(meta))
                final_distances.append(combined_scores[doc_id])

            return {
                'documents': [final_documents],
                'metadatas': [final_metadatas],
                'ids': [final_ids],
                'distances': [final_distances]
            }

    @classmethod
    def delete_texts(cls, ids):
        """
        Deletes texts from the vector store by ID.
        """
        if isinstance(ids, str):
            ids = [ids]
            
        with cls._get_connection().cursor() as cursor:
            cursor.execute("DELETE FROM cms_rag_vectors WHERE id = ANY(%s)", (ids,))
