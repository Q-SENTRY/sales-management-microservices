from pathlib import Path

path = Path('App.jsx')
text = path.read_text(encoding='utf-8')
first = text.find('const styles = {')
if first == -1:
    raise SystemExit('No const styles found')
second = text.find('const styles = {', first + 1)
if second == -1:
    raise SystemExit('Only one const styles found; no duplicate to remove')

# Remove the first occurrence if it appears before the second and before the real component end
brace = 0
in_string = None
escape = False
end = None
for i, ch in enumerate(text[first:], start=first):
    if in_string:
        if escape:
            escape = False
        elif ch == '\\':
            escape = True
        elif ch == in_string:
            in_string = None
    else:
        if ch in ('"', "'", '`'):
            in_string = ch
        elif ch == '{':
            brace += 1
        elif ch == '}':
            brace -= 1
            if brace == 0:
                end = i + 1
                break

if end is None:
    raise SystemExit('Could not find end of first styles object')

new_text = text[:first] + text[end:]
if new_text.count('const styles = {') != 1:
    raise SystemExit(f'Expected 1 const styles after removal, found {new_text.count("const styles = {")}')

path.write_text(new_text, encoding='utf-8')
print('Removed first duplicate styles block. New const styles count:', new_text.count('const styles = {'))
