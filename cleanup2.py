import io

file_path = 'src/components/dispatch/calltracking.tsx'
with io.open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in [864, 850, 761, 747]:
    if 'const match =' in lines[i]:
        lines[i] = lines[i].replace('const match = supervisor.member.match(/^(.+?)\\s\\[(.+?)\\]/);', '')
        
with io.open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print('Success')
