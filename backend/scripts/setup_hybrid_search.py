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

def setup_hybrid_search():
    print("Setting up Hybrid Search (Full-Text Search) in PostgreSQL...")
    
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
        # 1. Enable 'unaccent' extension for better text matching (removing accents)
        print("Enabling 'unaccent' extension...")
        cur.execute("CREATE EXTENSION IF NOT EXISTS unaccent;")
        
        # 2. Add GIN Index for Full-Text Search
        # We will index the 'document' column using French configuration + unaccent
        # Note: We are creating a generated column logic or just a functional index.
        # Functional index is easiest.
        
        print("Creating GIN index on 'document' column...")
        # Using French configuration by default since the user speaks French mostly
        cur.execute("""
            CREATE INDEX IF NOT EXISTS cms_rag_vectors_document_idx 
            ON cms_rag_vectors 
            USING GIN (to_tsvector('french', document));
        """)
        
        # Also keeping simple english one just in case? No, let's stick to French/Simple.
        # 'simple' is better if we have mixed content, but 'french' handles stemming.
        # User prompt was in French. Let's use 'french'.
        
        conn.commit()
        print("Hybrid Search setup completed successfully!")
        
    except Exception as e:
        conn.rollback()
        print(f"Error setting up Hybrid Search: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    setup_hybrid_search()
