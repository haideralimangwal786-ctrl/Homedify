file_path = r'e:\Homedify\frontend\src\pages\AdminDashboard.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip_next = False
i = 0
while i < len(lines):
    line = lines[i]
    
    # Remove the overflowX auto wrapper div opening tag (line 1876 area)
    if "overflowX: 'auto'" in line and '<div' in line:
        # Skip this line (the wrapper div)
        i += 1
        continue
    
    # Remove scroll={false} and style={{ minWidth: 860 }} lines from the Table
    if 'scroll={false}' in line:
        i += 1
        continue
    if 'style={{ minWidth: 860 }}' in line:
        i += 1
        continue
    
    # Remove the closing </div> that was the wrapper div
    # It comes right after the Table self-closing />
    # We detect it by looking at context - after the table columns end
    if '</div>' in line and i > 0:
        # Check if this is the wrapper div closing tag by looking at indentation
        stripped = line.lstrip()
        indent = len(line) - len(stripped)
        # The wrapper was at ~32 spaces indent (16 spaces of leading)
        if indent == 32 and stripped.strip() == '</div>':
            # Check if the previous non-empty line was />  (Table closing)
            prev_idx = i - 1
            while prev_idx >= 0 and lines[prev_idx].strip() == '':
                prev_idx -= 1
            if prev_idx >= 0 and lines[prev_idx].strip() == '/>':
                # This is the wrapper closing div - skip it
                i += 1
                continue
    
    new_lines.append(line)
    i += 1

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f'Done. Lines: {len(lines)} -> {len(new_lines)}')
