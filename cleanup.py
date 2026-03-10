import io

file_path = 'src/components/dispatch/calltracking.tsx'
with io.open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Verify the lines before deleting to be absolutely safe
if 'memberName' in lines[1015]:
    lines[1015] = lines[1015].replace('const memberName = match ? match[1] : supervisor.member;', '')
else:
    print('Safety check failed for 1016')

if 'memberName' in lines[1001]:
    lines[1001] = lines[1001].replace('const memberName = match ? match[1] : supervisor.member;', '')

if 'memberName' in lines[912]:
    lines[912] = lines[912].replace('const memberName = match ? match[1] : supervisor.member;', '')

if 'memberName' in lines[898]:
    lines[898] = lines[898].replace('const memberName = match ? match[1] : supervisor.member;', '')

# Delete duplicate functions (Lines 223 to 371)
if 'assignSupervisorToCall' in lines[222]:
    del lines[222:371]
else:
    print('Safety check failed for 223')

# Delete ScrollShadow (Line 13 is index 12)
if 'ScrollShadow' in lines[12]:
    lines[12] = ""
else:
    # try 11 and 13 just in case
    for i in [11, 13]:
        if 'ScrollShadow' in lines[i]:
            lines[i] = lines[i].replace('  ScrollShadow', '').replace('ScrollShadow', '')

with io.open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print('Success')
