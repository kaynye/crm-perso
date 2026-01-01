import os
import sys
import django
from pathlib import Path
import psycopg2

# Setup Django Environment
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.conf import settings

def migrate_schema():
    print("Migrating Database Schema for new Embeddings (1536 dims)...")
    
    db_config = settings.DATABASES['vector_db']
    conn = psycopg2.connect(
        dbname=db_config['NAME'],
        user=db_config['USER'],
        password=db_config['PASSWORD'],
        host=db_config['HOST'],
        port=db_config['PORT'],
        sslmode='require' 
    )
    
    cur = conn.cursor()
    
    try:
        # 1. Truncate Table (Remove all old 384-dim vectors)
        print("Truncating 'cms_rag_vectors' table...")
        cur.execute("TRUNCATE TABLE cms_rag_vectors;")
        
        # 2. Drop Index (Index depends on column type)
        print("Dropping old HNSW index...")
        cur.execute("DROP INDEX IF EXISTS cms_rag_vectors_embedding_idx;")
        
        # 3. Alter Column Type
        print("Altering 'embedding' column to vector(1536)...")
        # Need to use 'TYPE' keyword
        cur.execute("ALTER TABLE cms_rag_vectors ALTER COLUMN embedding TYPE vector(1536);")
        
        # 4. Re-create Index
        print("Re-creating HNSW index for 1536 dims...")
        cur.execute("CREATE INDEX cms_rag_vectors_embedding_idx ON cms_rag_vectors USING hnsw (embedding vector_l2_ops);")
        
        conn.commit()
        print("Schema migration completed successfully!")
        
    except Exception as e:
        conn.rollback()
        print(f"Error during schema migration: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    migrate_schema()
