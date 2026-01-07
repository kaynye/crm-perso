import os
import sys
import django
from django.db import connection

# Setup
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def fix_db():
    print("Attempting to add 'summary' column manually...")
    with connection.cursor() as cursor:
        try:
            # Check if column exists (MySQL specific)
            cursor.execute("""
                SELECT COUNT(*) 
                FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'ai_assistant_conversation' 
                AND COLUMN_NAME = 'summary';
            """)
            exists = cursor.fetchone()[0]
            
            if exists:
                print("Column 'summary' already exists.")
            else:
                print("Adding 'summary' column to ai_assistant_conversation...")
                cursor.execute("ALTER TABLE ai_assistant_conversation ADD COLUMN summary LONGTEXT;")
                print("SUCCESS: Column added.")
                
        except Exception as e:
            print(f"ERROR: {e}")

if __name__ == '__main__':
    fix_db()
