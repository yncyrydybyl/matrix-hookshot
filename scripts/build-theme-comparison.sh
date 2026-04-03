#!/bin/bash
# Build the docs with 15 different themes for side-by-side comparison.
# Output: docs-themes/<theme-name>/
#
# Usage: bash scripts/build-theme-comparison.sh

set -e

DOCS_DIR="docs"
THEME_FILE="$DOCS_DIR/.vitepress/theme/index.ts"
CONFIG_FILE="$DOCS_DIR/.vitepress/config.mts"
OUTPUT_BASE="docs-themes"

# Save originals
cp "$THEME_FILE" "${THEME_FILE}.bak"
cp "$CONFIG_FILE" "${CONFIG_FILE}.bak"

cleanup() {
  mv "${THEME_FILE}.bak" "$THEME_FILE" 2>/dev/null || true
  mv "${CONFIG_FILE}.bak" "$CONFIG_FILE" 2>/dev/null || true
}
trap cleanup EXIT

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

rm -rf "$OUTPUT_BASE"
mkdir -p "$OUTPUT_BASE"

TOTAL=${#THEMES[@]}
CURRENT=0
FAILED=0

for entry in "${THEMES[@]}"; do
  IFS='|' read -r name type flavor accent dark_hl light_hl <<< "$entry"
  CURRENT=$((CURRENT + 1))
  echo ""
  echo "=== [$CURRENT/$TOTAL] Building theme: $name ==="

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
  esac

  # Restore config from backup before each theme (clean slate)
  cp "${CONFIG_FILE}.bak" "$CONFIG_FILE"
  sed -i "s/dark: '.*'/dark: '${dark_hl}'/" "$CONFIG_FILE"
  sed -i "s/light: '.*'/light: '${light_hl}'/" "$CONFIG_FILE"

  # Set base path so assets resolve correctly when served from subdirectory
  sed -i "s|cleanUrls: true,|cleanUrls: true,\n  base: '/${name}/',|" "$CONFIG_FILE"

  # Build to a SEPARATE output dir per theme
  THEME_OUT="$OUTPUT_BASE/$name"
  if npx vitepress build "$DOCS_DIR" --outDir "$(pwd)/$THEME_OUT" 2>&1 | tail -1; then
    echo "    ✅ $name"
  else
    echo "    ❌ FAILED: $name"
    FAILED=$((FAILED + 1))
  fi
done

echo ""
echo "=== $((TOTAL - FAILED))/$TOTAL themes built ==="
echo "Output: $OUTPUT_BASE/"
ls -d "$OUTPUT_BASE/"*/ 2>/dev/null | while read d; do echo "  $(basename "$d")"; done
echo ""
echo "Next: bash scripts/build-theme-index.sh"
