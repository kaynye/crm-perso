import os
import sys
import django
from pathlib import Path
import psycopg2
from pgvector.psycopg2 import register_vector
import chromadb
import json

# Setup Django Environment
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.conf import settings

def migrate():
    print("Starting migration from ChromaDB to PostgreSQL...")

    # 1. Connect to ChromaDB
    chroma_path = os.path.join(settings.BASE_DIR, 'chroma_data')
    if not os.path.exists(chroma_path):
        print(f"Chroma data not found at {chroma_path}")
        return

    chroma_client = chromadb.PersistentClient(path=chroma_path)
    try:
        collection = chroma_client.get_collection("cms_rag_collection")
    except Exception as e:
        print(f"Could not find collection: {e}")
        return

    # Fetch all data
    # Chroma get() without ids returns everything if limit is not set? 
    # Better to inspect count first.
    count = collection.count()
    print(f"Found {count} documents in ChromaDB.")
    
    if count == 0:
        print("Nothing to migrate.")
        return

    data = collection.get(include=['embeddings', 'documents', 'metadatas'])
    
    ids = data['ids']
    embeddings = data['embeddings']
    documents = data['documents']
    metadatas = data['metadatas']

    # 2. Connect to PostgreSQL
    db_config = settings.DATABASES['vector_db']
    conn = psycopg2.connect(
        dbname=db_config['NAME'],
        user=db_config['USER'],
        password=db_config['PASSWORD'],
        host=db_config['HOST'],
        port=db_config['PORT'],
        sslmode='require' 
    )
    
    # Register vector extension type for psycopg2
    # Note: We need to enable the extension in the DB first.
    cur = conn.cursor()
    
    try:
        cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        register_vector(conn)
        
        # 3. Create Table
        print("Creating table 'cms_rag_vectors'...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS cms_rag_vectors (
                id TEXT PRIMARY KEY,
                embedding vector(384),
                document TEXT,
                metadata JSONB
            );
        """)
        
        # 4. Insert Data
        print("Inserting data...")
        for i, doc_id in enumerate(ids):
            embedding = embeddings[i]
            document = documents[i] if documents else None
            metadata = metadatas[i] if metadatas else None
            
            cur.execute("""
                INSERT INTO cms_rag_vectors (id, embedding, document, metadata)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE 
                SET embedding = EXCLUDED.embedding,
                    document = EXCLUDED.document,
                    metadata = EXCLUDED.metadata;
            """, (doc_id, embedding, document, json.dumps(metadata) if metadata else None))
            
            if (i + 1) % 100 == 0:
                print(f"Processed {i + 1}/{count}...")
        
        # 5. Create Index (HNSW)
        print("Creating HNSW index...")
        # Dropping index first to ensure clean creation if params changed or just simple IF NOT EXISTS
        cur.execute("CREATE INDEX IF NOT EXISTS cms_rag_vectors_embedding_idx ON cms_rag_vectors USING hnsw (embedding vector_l2_ops);")
        
        conn.commit()
        print("Migration completed successfully!")
        
    except Exception as e:
        conn.rollback()
        print(f"Error during migration: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    migrate()
