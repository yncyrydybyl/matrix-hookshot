#!/bin/bash
# Build the docs with 15 different themes for side-by-side comparison.
# Output: docs/.vitepress/dist/themes/<theme-name>/
#
# Themes:
#   - Default VitePress (2 syntax highlight variants)
#   - Catppuccin Mocha (6 accent colors)
#   - Catppuccin Frappé (3 accent colors)
#   - Catppuccin Macchiato (3 accent colors)
#   - Aplós (standalone theme)
#
# Usage: bash scripts/build-theme-comparison.sh

set -e

DOCS_DIR="docs"
THEME_FILE="$DOCS_DIR/.vitepress/theme/index.ts"
CONFIG_FILE="$DOCS_DIR/.vitepress/config.mts"
OUTPUT_BASE="$DOCS_DIR/.vitepress/dist"

# Save originals
cp "$THEME_FILE" "${THEME_FILE}.bak"
cp "$CONFIG_FILE" "${CONFIG_FILE}.bak"

cleanup() {
  mv "${THEME_FILE}.bak" "$THEME_FILE" 2>/dev/null || true
  mv "${CONFIG_FILE}.bak" "$CONFIG_FILE" 2>/dev/null || true
}
trap cleanup EXIT

# Theme definitions: name|type|flavor|accent|dark_hl|light_hl
# type: default, catppuccin, aplos
THEMES=(
  "default|default|none|none|github-dark|github-light"
  "default-dimmed|default|none|none|github-dark-dimmed|github-light"
  "mocha-green|catppuccin|mocha|green|catppuccin-mocha|catppuccin-latte"
  "mocha-blue|catppuccin|mocha|blue|catppuccin-mocha|catppuccin-latte"
  "mocha-mauve|catppuccin|mocha|mauve|catppuccin-mocha|catppuccin-latte"
  "mocha-pink|catppuccin|mocha|pink|catppuccin-mocha|catppuccin-latte"
  "mocha-sapphire|catppuccin|mocha|sapphire|catppuccin-mocha|catppuccin-latte"
  "mocha-lavender|catppuccin|mocha|lavender|catppuccin-mocha|catppuccin-latte"
  "frappe-green|catppuccin|frappe|green|catppuccin-frappe|catppuccin-latte"
  "frappe-blue|catppuccin|frappe|blue|catppuccin-frappe|catppuccin-latte"
  "frappe-mauve|catppuccin|frappe|mauve|catppuccin-frappe|catppuccin-latte"
  "macchiato-green|catppuccin|macchiato|green|catppuccin-macchiato|catppuccin-latte"
  "macchiato-blue|catppuccin|macchiato|blue|catppuccin-macchiato|catppuccin-latte"
  "macchiato-lavender|catppuccin|macchiato|lavender|catppuccin-macchiato|catppuccin-latte"
  "macchiato-peach|catppuccin|macchiato|peach|catppuccin-macchiato|catppuccin-latte"
)

mkdir -p "$OUTPUT_BASE/themes"

TOTAL=${#THEMES[@]}
CURRENT=0
FAILED=0

for entry in "${THEMES[@]}"; do
  IFS='|' read -r name type flavor accent dark_hl light_hl <<< "$entry"
  CURRENT=$((CURRENT + 1))
  echo ""
  echo "=== [$CURRENT/$TOTAL] Building theme: $name ($type) ==="

  # Write theme/index.ts based on type
  case "$type" in
    default)
      cat > "$THEME_FILE" << 'EOF'
import DefaultTheme from 'vitepress/theme'
export default DefaultTheme
EOF
      ;;
    catppuccin)
      cat > "$THEME_FILE" << EOF
import DefaultTheme from 'vitepress/theme'
import '@catppuccin/vitepress/theme/${flavor}/${accent}.css'
export default DefaultTheme
EOF
      ;;
    aplos)
      cat > "$THEME_FILE" << 'EOF'
import Aplos from 'aplos'
export default Aplos
EOF
      ;;
  esac

  # Update syntax highlighting in config
  sed -i "s/dark: '.*'/dark: '${dark_hl}'/" "$CONFIG_FILE"
  sed -i "s/light: '.*'/light: '${light_hl}'/" "$CONFIG_FILE"

  # Build
  if npx vitepress build "$DOCS_DIR" 2>&1 | tail -2; then
    # Copy output (avoid nesting themes/ inside themes/)
    TMPDIR=$(mktemp -d)
    cp -r "$OUTPUT_BASE/"* "$TMPDIR/" 2>/dev/null || true
    rm -rf "$TMPDIR/themes"
    rm -rf "$OUTPUT_BASE/themes/$name"
    mv "$TMPDIR" "$OUTPUT_BASE/themes/$name"
    echo "    ✅ Built: themes/$name/"
  else
    echo "    ❌ FAILED: $name"
    FAILED=$((FAILED + 1))
  fi
done

echo ""
echo "=== Results: $((TOTAL - FAILED))/$TOTAL themes built ==="
if [ $FAILED -gt 0 ]; then
  echo "    $FAILED theme(s) failed to build"
fi
echo ""
echo "Output: $OUTPUT_BASE/themes/"
ls -d "$OUTPUT_BASE/themes/"*/ 2>/dev/null | while read d; do echo "  $(basename "$d")"; done
