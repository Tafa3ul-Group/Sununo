
import sys
import re

def check_jsx_nesting(filename):
    with open(filename, 'r') as f:
        content = f.read()
    
    # Improved regex to find:
    # 1. Opening tags: <Tag
    # 2. Closing tags: </Tag>
    # 3. Self-closing tags: <Tag ... />
    
    # Step 1: Remove comments
    content = re.sub(r'{\s*/\*.*?\*/\s*}', '', content, flags=re.DOTALL)
    content = re.sub(r'//.*', '', content)
    
    stack = []
    lines = content.split('\n')
    
    for i, line in enumerate(lines):
        # find all matches: <(\w+)|</(\w+)>|<(\w+)[^>]*?/>
        # Actually search for tags sequentially
        pos = 0
        while True:
            # Match an opening tag, closing tag, or self-closing tag
            match = re.search(r'<(/?[a-zA-Z0-9\.]+)([^>]*?)(/?)>', line[pos:])
            if not match:
                break
            
            full_tag = match.group(0)
            tag_name = match.group(1)
            attributes = match.group(2)
            is_self_closing = match.group(3) == '/'
            
            # Update pos
            pos += match.end()
            
            if is_self_closing:
                # print(f"Self-closing <{tag_name}> at line {i+1}")
                continue
            
            if tag_name.startswith('/'):
                tag_name = tag_name[1:]
                if not stack:
                    print(f"Error: Unexpected close tag </{tag_name}> at line {i+1}")
                else:
                    open_tag, open_line = stack.pop()
                    if open_tag != tag_name:
                        print(f"Error: Mismatched tags! Open <{open_tag}> at line {open_line} vs Close </{tag_name}> at line {i+1}")
            else:
                stack.append((tag_name, i+1))
                
    if stack:
        print("Unclosed tags:")
        for tag, line in stack:
            print(f"<{tag}> at line {line}")

if __name__ == "__main__":
    check_jsx_nesting(sys.argv[1])
