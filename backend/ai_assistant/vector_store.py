import chromadb
from chromadb.utils import embedding_functions
from django.conf import settings
import os

class VectorStore:
    _client = None
    _collection = None

    @classmethod
    def get_client(cls):
        if cls._client is None:
            # Persist data to disk
            persist_path = os.path.join(settings.BASE_DIR, 'chroma_data')
            cls._client = chromadb.PersistentClient(path=persist_path)
        return cls._client

    @classmethod
    def get_collection(cls):
        if cls._collection is None:
            client = cls.get_client()
            # Use OpenAI embedding function if available, otherwise default (all-MiniLM-L6-v2)
            # For simplicity and cost, we can start with the default local model for now,
            # or use OpenAI if the key is present.
            
            # Let's use the default local embedding function provided by Chroma for now
            # to avoid extra API costs during indexing. It's decent for RAG.
            # If user wants better quality, we can switch to OpenAIEmbeddingFunction.
            
            # openai_key = settings.AI_CONF.get('API_KEY')
            # if openai_key and settings.AI_CONF.get('PROVIDER') == 'openai':
            #     ef = embedding_functions.OpenAIEmbeddingFunction(
            #         api_key=openai_key,
            #         model_name="text-embedding-ada-002"
            #     )
            # else:
            #     # Default to SentenceTransformer (local)
            #     # Note: This might require downloading models on first run.
            ef = embedding_functions.DefaultEmbeddingFunction()

            cls._collection = client.get_or_create_collection(
                name="cms_rag_collection",
                embedding_function=ef
            )
        return cls._collection

    @classmethod
    def add_texts(cls, texts, metadatas, ids):
        """
        Adds texts to the vector store.
        """
        collection = cls.get_collection()
        collection.upsert(
            documents=texts,
            metadatas=metadatas,
            ids=ids
        )

    @classmethod
    def search(cls, query, k=5, filter=None):
        """
        Searches for relevant texts.
        """
        collection = cls.get_collection()
        results = collection.query(
            query_texts=[query],
            n_results=k,
            where=filter # Optional metadata filtering
        )
        return results

    @classmethod
    def delete_texts(cls, ids):
        """
        Deletes texts from the vector store by ID.
        """
        collection = cls.get_collection()
        # Chroma expects a list of IDs
        if isinstance(ids, str):
            ids = [ids]
        
        try:
            collection.delete(ids=ids)
        except Exception as e:
            print(f"Error deleting from VectorStore: {e}")
