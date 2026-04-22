#!/bin/bash
# Convert hidden <!-- Code: ... --> comments to visible GitHub source links.
# Usage: bash scripts/convert-evidence.sh
#
# Converts <!-- Code: src/Bridge.ts:299-1023 --> to visible blockquote with link.
# Handles descriptions in parentheses, multiple comma-separated refs.

set -e

REPO_URL="https://github.com/matrix-org/matrix-hookshot/blob/main"
DOCS_DIRS="docs/understand docs/get-started docs/integrations docs/architecture docs/guides/operator docs/reference docs/troubleshooting docs/project"

# Use Python for reliable parsing
python3 << 'PYEOF'
import re, os, glob

REPO_URL = "https://github.com/matrix-org/matrix-hookshot/blob/main"
DIRS = "docs/understand docs/get-started docs/integrations docs/architecture docs/guides/operator docs/reference docs/troubleshooting docs/project".split()

# Match: src/path/File.ts:123-456 with optional (description)
REF_PATTERN = re.compile(r'(src/[\w/.-]+(?::\d+(?:-\d+)?)?)\s*(?:\([^)]*\))?')

def make_link(ref):
    """Convert a source reference to a GitHub permalink."""
    # Extract path and optional line numbers
    match = re.match(r'(src/[\w/.-]+?)(?::(\d+)(?:-(\d+))?)?$', ref.strip())
    if not match:
        return None
    path, start, end = match.groups()
    if start and end:
        return f'[`{path}:{start}-{end}`]({REPO_URL}/{path}#L{start}-L{end})'
    elif start:
        return f'[`{path}:{start}`]({REPO_URL}/{path}#L{start})'
    else:
        return f'[`{path}`]({REPO_URL}/{path})'

def convert_comment(comment_text):
    """Convert a <!-- Code: ... --> comment to a visible source blockquote."""
    # Strip the comment markers
    inner = comment_text.replace('<!-- Code:', '').replace('-->', '').strip()

    # Find all src/ references
    refs = REF_PATTERN.findall(inner)
    if not refs:
        # Non-src references (like @botCommand decorators) — keep as note
        return f'> **Source:** {inner}'

    links = []
    for ref in refs:
        link = make_link(ref)
        if link:
            links.append(link)

    if not links:
        return f'> **Source:** {inner}'

    return '> **Source:** ' + ' · '.join(links)

total = 0
converted = 0

for d in DIRS:
    for pattern in [f'{d}/*.md', f'{d}/**/*.md']:
        for filepath in glob.glob(pattern, recursive=True):
            with open(filepath, 'r') as f:
                lines = f.readlines()

            new_lines = []
            changed = False
            for line in lines:
                if '<!-- Code:' in line and '-->' in line:
                    total += 1
                    comment = line.strip()
                    replacement = convert_comment(comment)
                    new_lines.append(replacement + '\n')
                    changed = True
                    converted += 1
                elif '<!-- Assumption' in line and '-->' in line:
                    total += 1
                    inner = line.strip().replace('<!--', '').replace('-->', '').strip()
                    new_lines.append(f'> ⚠️ **{inner}**\n')
                    changed = True
                    converted += 1
                elif '<!-- Note:' in line and '-->' in line:
                    total += 1
                    inner = line.strip().replace('<!-- Note:', '').replace('-->', '').strip()
                    new_lines.append(f'> **Note:** {inner}\n')
                    changed = True
                    converted += 1
                else:
                    new_lines.append(line)

            if changed:
                with open(filepath, 'w') as f:
                    f.writelines(new_lines)
                print(f'  ✅ {filepath} ({sum(1 for l in new_lines if l.startswith("> **Source:**"))} refs)')

print(f'\n=== Converted {converted} of {total} hidden comments to visible evidence ===')
PYEOF
