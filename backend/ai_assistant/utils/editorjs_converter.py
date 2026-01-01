import re
import time

def convert_markdown_to_editorjs(text):
    """
    Converts a Markdown string to EditorJS blocks JSON structure.
    Supported:
    - Headers (#, ##, ...)
    - lists (unordered - )
    - checklists ([ ], [x])
    - tables (| ... |)
    - paragraphs
    """
    blocks = []
    lines = text.split('\n')
    
    current_list_items = []
    current_list_type = None # 'unordered' or 'checklist'
    
    current_table_rows = []
    
    def flush_list():
        nonlocal current_list_items, current_list_type, blocks
        if not current_list_items:
            return
            
        if current_list_type == 'checklist':
            blocks.append({
                "type": "checklist",
                "data": {
                    "items": current_list_items
                }
            })
        elif current_list_type == 'unordered':
            blocks.append({
                "type": "list",
                "data": {
                    "style": "unordered",
                    "items": current_list_items
                }
            })
        current_list_items = []
        current_list_type = None

    def flush_table():
        nonlocal current_table_rows, blocks
        if not current_table_rows:
            return
            
        # Process rows to find headers etc
        content = []
        with_headings = False
        
        # Check for separator row (e.g. |---|---|)
        # It usually contains only -, |, : and spaces
        cleaned_rows = []
        for row in current_table_rows:
             # Check if this is a separator row
             # Remove pipes and spaces
             check = row.replace('|', '').replace('-', '').replace(':', '').strip()
             if check == '':
                 # It's a separator line, ignore it but mark previous as header
                 if len(cleaned_rows) > 0:
                     with_headings = True
                 continue
             
             # Parse cells
             # Split by | but ignore leading/trailing empty strings from split
             cells = [c.strip() for c in row.split('|')]
             
             # If line started/ended with |, the first/last split elements are empty
             if row.strip().startswith('|') and len(cells) > 0 and cells[0] == '':
                 cells.pop(0)
             if row.strip().endswith('|') and len(cells) > 0 and cells[-1] == '':
                 cells.pop(-1)
                 
             cleaned_rows.append(cells)
        
        if cleaned_rows:
            blocks.append({
                "type": "table",
                "data": {
                    "withHeadings": with_headings,
                    "content": cleaned_rows
                }
            })
            
        current_table_rows = []

    def flush_all():
        flush_list()
        flush_table()

    for line in lines:
        stripped_line = line.strip()
        
        # Empty Line -> Flush all
        if not stripped_line:
            flush_all()
            continue
            
        # Table Detection
        # Line must contain | and have at least 2 chars
        if '|' in stripped_line:
             # Heuristic: verify it looks like a table row
             # Usually starts with | or has multiple | inside
             if stripped_line.startswith('|') or stripped_line.count('|') >= 1:
                 # Check if it's not just valid text with a pipe naturally (rare)
                 # Assume table context if we are already in table or if it starts with |
                 if current_table_rows or stripped_line.startswith('|'):
                     flush_list() # Close any previous list
                     current_table_rows.append(stripped_line)
                     continue

        # If we were in a table but this line is not a table, flush table
        if current_table_rows:
            flush_table()

        # Headers
        header_match = re.match(r'^(#{1,6})\s+(.*)', stripped_line)
        if header_match:
            flush_all()
            level = len(header_match.group(1))
            content = header_match.group(2)
            blocks.append({
                "type": "header",
                "data": {
                    "text": content,
                    "level": level
                }
            })
            continue
            
        # Checklist
        checklist_match = re.match(r'^[-*]\s+\[([ xX])\]\s+(.*)', stripped_line)
        if not checklist_match:
             # Try simpler pattern "[ ] item"
             checklist_match = re.match(r'^\[([ xX])\]\s+(.*)', stripped_line)
             
        if checklist_match:
            if current_list_type != 'checklist':
                flush_all()
                current_list_type = 'checklist'
            
            checked = checklist_match.group(1).lower() == 'x'
            content = checklist_match.group(2)
            current_list_items.append({
                "text": content,
                "checked": checked
            })
            continue

        # Simple List
        list_match = re.match(r'^[-*]\s+(.*)', stripped_line)
        if list_match:
            if current_list_type != 'unordered':
                flush_all()
                current_list_type = 'unordered'
            
            content = list_match.group(1)
            current_list_items.append(content) # EditorJS list items are just strings in the array
            continue
            
        # Paragraph
        flush_all()
        blocks.append({
            "type": "paragraph",
            "data": {
                "text": stripped_line
            }
        })
        
    flush_all()
    
    return {
        "time": int(time.time() * 1000),
        "blocks": blocks,
        "version": "2.29.1" # Example version
    }
