import os
import re

target_dirs = ['./app', './components']

# Pattern: fontFamily: "LamaSans-...", possibly with fontWeight nearby
font_weight_pattern = re.compile(r'fontWeight:\s*[\'"][^\'"]+[\'"]\s*,?\s*')

for target_dir in target_dirs:
    if not os.path.exists(target_dir):
        continue
    for root, dirs, files in os.walk(target_dir):
        for file in files:
            if file.endswith(('.tsx', '.ts')) and file != 'solar-icons.tsx':
                file_path = os.path.join(root, file)
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                original = content
                
                def remove_weight_if_named_font(match):
                    block = match.group(0)
                    if 'LamaSans-' in block and 'fontWeight' in block:
                        new_block = font_weight_pattern.sub('', block)
                        # Clean up trailing comma if any
                        new_block = new_block.replace(', }', ' }').replace(',}', '}')
                        return new_block
                    return block

                # Simpler regex to find style objects with LamaSans
                style_block_pattern = re.compile(r'\{[^\}]*fontFamily:\s*["\']LamaSans-[^"\']+["\'][^\}]*\}')
                content = style_block_pattern.sub(remove_weight_if_named_font, content)
                
                if content != original:
                    print(f"Cleaned Weight: {file_path}")
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(content)
