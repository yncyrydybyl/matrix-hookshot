#!/bin/bash
# Export documentation as PDF using vitepress-export-pdf.
# Requires a running VitePress dev server.
#
# Usage:
#   bash scripts/export-pdf.sh
#
# Output: hookshot-docs.pdf

set -e

echo "Starting VitePress dev server..."
npx vitepress dev docs --port 4173 &
DEV_PID=$!

# Wait for server to be ready
sleep 5
for i in $(seq 1 30); do
  curl -s http://localhost:4173 > /dev/null 2>&1 && break
  sleep 1
done

echo "Exporting PDF..."
npx press-export-pdf export http://localhost:4173 \
  --outFile hookshot-docs.pdf \
  --pdfMargin "20mm" \
  --pdfFormat "A4" \
  --urlOrigin http://localhost:4173 \
  2>&1 || {
    echo "press-export-pdf failed, trying alternative..."
    # Fallback: use Playwright directly
    npx playwright install chromium 2>/dev/null
    node -e "
    const { chromium } = require('playwright');
    (async () => {
      const browser = await chromium.launch();
      const page = await browser.newPage();
      await page.goto('http://localhost:4173/get-started/quickstart', { waitUntil: 'networkidle' });
      await page.pdf({ path: 'hookshot-docs.pdf', format: 'A4', margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' }, printBackground: true });
      await browser.close();
      console.log('PDF exported: hookshot-docs.pdf');
    })();
    "
  }

# Clean up
kill $DEV_PID 2>/dev/null
echo "Done: hookshot-docs.pdf"
