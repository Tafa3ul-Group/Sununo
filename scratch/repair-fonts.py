import os
import re

target_dirs = ['./app', './components']

# Pattern: ...Typography.[type], then some props, then the injected fontFamily: "LamaSans-Regular"
injected_pattern = re.compile(r'(\.\.\.Typography\.[a-zA-Z0-9]+,[^}]+),\s*fontFamily:\s*"LamaSans-Regular"\s*\}')

for target_dir in target_dirs:
    if not os.path.exists(target_dir):
        continue
    for root, dirs, files in os.walk(target_dir):
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                file_path = os.path.join(root, file)
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                original = content
                # Remove the override that was added by the previous script
                content = injected_pattern.sub(r'\1 }', content)
                
                if content != original:
                    print(f"Repaired: {file_path}")
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(content)

# Also fix cases where fontFamily: "LamaSans-Regular" was added but the body has fontWeight: 'bold' etc.
# The previous script tried to be smart but might have failed if it was already updated once.
