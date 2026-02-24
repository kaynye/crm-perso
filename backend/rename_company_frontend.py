import os

replacements = [
    ('Company', 'Space'),
    ('company', 'space'),
    ('Companies', 'Spaces'),
    ('companies', 'spaces'),
    ('Entreprise', 'Espace'),
    ('entreprise', 'espace'),
    ('Entreprises', 'Espaces'),
    ('entreprises', 'espaces'),
]

frontend_dir = '/Users/voumby/Documents/cms/frontend/src'

# First replace contents
for root, dirs, f_names in os.walk(frontend_dir):
    for f_name in f_names:
        if not (f_name.endswith(('.ts', '.tsx', '.js', '.jsx', '.json'))):
            continue
        path = os.path.join(root, f_name)
        try:
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            orig = content
            # Safe exact replacements
            for k, v in replacements:
                content = content.replace(k, v)
            if orig != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print("Updated content in", path)
        except Exception as e:
            print(f"Error processing {path}: {e}")

# Then rename files and directories bottom-up
for root, dirs, f_names in os.walk(frontend_dir, topdown=False):
    for name in f_names + dirs:
        has_change = False
        new_name = name
        for k, v in [('Company', 'Space'), ('company', 'space'), ('Companies', 'Spaces'), ('companies', 'spaces')]:
            if k in new_name:
                new_name = new_name.replace(k, v)
                has_change = True
        if has_change:
            old_path = os.path.join(root, name)
            new_path = os.path.join(root, new_name)
            os.rename(old_path, new_path)
            print("Renamed", old_path, "to", new_path)
