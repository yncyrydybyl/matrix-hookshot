#!/bin/bash
# Build the docs with many different themes for side-by-side comparison.
# Output: docs-themes/<theme-name>/
#
# Usage: bash scripts/build-theme-comparison.sh [--quick]
#   --quick: build only 15 representative themes (faster)
#   default: build all ~50 themes

set -e

DOCS_DIR="docs"
THEME_FILE="$DOCS_DIR/.vitepress/theme/index.ts"
CONFIG_FILE="$DOCS_DIR/.vitepress/config.mts"
OUTPUT_BASE="docs-themes"

cp "$THEME_FILE" "${THEME_FILE}.bak"
cp "$CONFIG_FILE" "${CONFIG_FILE}.bak"

cleanup() {
  mv "${THEME_FILE}.bak" "$THEME_FILE" 2>/dev/null || true
  mv "${CONFIG_FILE}.bak" "$CONFIG_FILE" 2>/dev/null || true
}
trap cleanup EXIT

# Format: name|type|flavor|accent|dark_hl|light_hl
# type: default (no CSS override), catppuccin (CSS import)
THEMES=()

# === DEFAULT VITEPRESS with different syntax highlighting ===
THEMES+=(
  "default-github|default|none|none|github-dark|github-light"
  "default-dimmed|default|none|none|github-dark-dimmed|github-light"
  "default-dracula|default|none|none|dracula|github-light"
  "default-nord|default|none|none|nord|github-light"
  "default-one-dark|default|none|none|one-dark-pro|one-light"
  "default-tokyo-night|default|none|none|tokyo-night|github-light"
  "default-material-ocean|default|none|none|material-theme-ocean|material-theme-lighter"
  "default-rose-pine|default|none|none|rose-pine|rose-pine-dawn"
  "default-vitesse|default|none|none|vitesse-dark|vitesse-light"
  "default-monokai|default|none|none|monokai|github-light"
  "default-synthwave|default|none|none|synthwave-84|github-light"
  "default-solarized|default|none|none|solarized-dark|solarized-light"
  "default-everforest|default|none|none|everforest-dark|everforest-light"
  "default-poimandres|default|none|none|poimandres|github-light"
  "default-night-owl|default|none|none|night-owl|github-light"
  "default-kanagawa|default|none|none|kanagawa-wave|kanagawa-lotus"
  "default-houston|default|none|none|houston|github-light"
  "default-aurora|default|none|none|aurora-x|github-light"
  "default-slack|default|none|none|slack-dark|slack-ochin"
  "default-snazzy|default|none|none|min-dark|snazzy-light"
)

# === CATPPUCCIN MOCHA (warm dark) — all 14 accents ===
for accent in blue flamingo green lavender maroon mauve peach pink red rosewater sapphire sky teal yellow; do
  THEMES+=("mocha-${accent}|catppuccin|mocha|${accent}|catppuccin-mocha|catppuccin-latte")
done

# === CATPPUCCIN FRAPPÉ (mid-tone) — 6 best accents ===
for accent in blue green lavender mauve sapphire teal; do
  THEMES+=("frappe-${accent}|catppuccin|frappe|${accent}|catppuccin-frappe|catppuccin-latte")
done

# === CATPPUCCIN MACCHIATO (cool dark) — 6 best accents ===
for accent in blue green lavender mauve peach sapphire; do
  THEMES+=("macchiato-${accent}|catppuccin|macchiato|${accent}|catppuccin-macchiato|catppuccin-latte")
done

# Quick mode: only build representative subset
if [ "$1" = "--quick" ]; then
  QUICK_NAMES="default-github default-dracula default-nord default-tokyo-night default-rose-pine default-vitesse default-solarized default-everforest mocha-green mocha-blue mocha-mauve mocha-pink frappe-blue frappe-green macchiato-blue"
  FILTERED=()
  for entry in "${THEMES[@]}"; do
    name="${entry%%|*}"
    for q in $QUICK_NAMES; do
      [ "$name" = "$q" ] && FILTERED+=("$entry") && break
    done
  done
  THEMES=("${FILTERED[@]}")
  echo "Quick mode: building ${#THEMES[@]} themes"
fi

rm -rf "$OUTPUT_BASE"
mkdir -p "$OUTPUT_BASE"

TOTAL=${#THEMES[@]}
CURRENT=0
FAILED=0

for entry in "${THEMES[@]}"; do
  IFS='|' read -r name type flavor accent dark_hl light_hl <<< "$entry"
  CURRENT=$((CURRENT + 1))
  echo ""
  echo "=== [$CURRENT/$TOTAL] $name ==="

  # Restore config from backup (clean slate)
  cp "${CONFIG_FILE}.bak" "$CONFIG_FILE"

  # Write theme file
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

  # Set syntax highlighting and base path
  sed -i "s/dark: '.*'/dark: '${dark_hl}'/" "$CONFIG_FILE"
  sed -i "s/light: '.*'/light: '${light_hl}'/" "$CONFIG_FILE"
  sed -i "s|cleanUrls: true,|cleanUrls: true,\n  base: '/${name}/',|" "$CONFIG_FILE"

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
echo ""
echo "Next: bash scripts/build-theme-index.sh"
