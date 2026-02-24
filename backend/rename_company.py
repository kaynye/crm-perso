import os
import re

replacements = [
    ('Space', 'Space'),
    ('space', 'space'),
    ('Spaces', 'Spaces'),
    ('spaces', 'spaces'),
]

backend_dir = '/Users/voumby/Documents/cms/backend'

for root, dirs, f_names in os.walk(backend_dir):
    for f_name in f_names:
        if not f_name.endswith('.py') or 'migrations' in root or 'venv' in root or f_name == 'models.py':
            continue
        path = os.path.join(root, f_name)
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        orig = content
        for k, v in replacements:
            content = content.replace(k, v)
        
        if orig != content:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            print("Updated", path)
