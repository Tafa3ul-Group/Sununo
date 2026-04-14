import os
import re

target_dirs = ['./app', './components']
# We want to catch any style object that looks like it's for Text but hasn't been updated yet
# We check for common text properties but NOT fontFamily
text_prop_pattern = re.compile(r'(\b(fontSize|color|lineHeight|textAlign|letterSpacing|textTransform|textDecorationLine)\b:[^},]+)')

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
                
                # Use a state machine approach for each style block
                def update_styles(match):
                    style_body = match.group(2)
                    # Split by properties (assuming one per line or separated by comma)
                    lines = style_body.split('\n')
                    new_lines = []
                    for line in lines:
                        # If a line has a property but no fontFamily in the same logical object
                        # This is a bit complex for a regex, so let's do it per property group
                        # Actually, let's just use a simpler marker: if the block has text props but no fontFamily
                        if any(p in line for p in ['fontSize', 'color', 'fontWeight']) and 'fontFamily' not in style_body:
                            # Avoid injecting multiple times
                            if 'fontFamily' not in line:
                                # If it has fontWeight, the previous script might have handled it, 
                                # but if it's just fontSize/color, we add Regular
                                line = line.replace('}', ', fontFamily: "LamaSans-Regular" }')
                        new_lines.append(line)
                    return match.group(1) + '\n'.join(new_lines) + match.group(3)

                # Find StyleSheet.create blocks and apply to each key-value pair
                # Pattern matches key: { props }
                style_key_pattern = re.compile(r'(\s*[a-zA-Z0-9_-]+\s*:\s*\{)([^\}]+)(\})', re.MULTILINE)
                
                def replace_func(m):
                    prefix = m.group(1)
                    body = m.group(2)
                    suffix = m.group(3)
                    
                    # If it has text properties but NO fontFamily
                    if any(p in body for p in ['fontSize', 'fontWeight', 'color', 'lineHeight']) and 'fontFamily' not in body:
                        # Determine weight if possible, else Regular
                        f_family = 'LamaSans-Regular'
                        if "'700'" in body or '"700"' in body or 'bold' in body:
                            f_family = 'LamaSans-Bold'
                        elif "'900'" in body or '"900"' in body or 'black' in body:
                            f_family = 'LamaSans-Black'
                        elif "'600'" in body or '"600"' in body:
                            f_family = 'LamaSans-SemiBold'
                        elif "'500'" in body or '"500"' in body:
                            f_family = 'LamaSans-Medium'
                        
                        # Add it before the closing brace
                        if body.strip().endswith(','):
                            return f"{prefix}{body} fontFamily: \"{f_family}\" {suffix}"
                        else:
                            return f"{prefix}{body}, fontFamily: \"{f_family}\" {suffix}"
                    return m.group(0)

                content = style_key_pattern.sub(replace_func, content)
                
                if content != original:
                    print(f"Aggressive Update: {file_path}")
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(content)
