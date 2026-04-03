#!/bin/bash
# Generate an HTML comparison page for all built themes.
# Run AFTER build-theme-comparison.sh
#
# Usage: bash scripts/build-theme-index.sh

OUTPUT_BASE="docs-themes"
mkdir -p "$OUTPUT_BASE/themes"

cat > "$OUTPUT_BASE/themes/index.html" << 'HTMLEOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hookshot Docs — Theme Comparison</title>
  <style>
    :root {
      --bg: #1e1e2e; --surface: #181825; --border: #313244;
      --text: #cdd6f4; --subtext: #a6adc8; --accent: #a6e3a1;
      --accent2: #89b4fa; --card-bg: #1e1e2e;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; background: var(--bg); color: var(--text); }
    .container { max-width: 1800px; margin: 0 auto; padding: 2rem; }
    header { text-align: center; padding: 3rem 1rem 2rem; }
    h1 { font-size: 3rem; font-weight: 800;
      background: linear-gradient(135deg, var(--accent), var(--accent2));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .subtitle { color: var(--subtext); font-size: 1.2rem; margin-top: 0.5rem; }
    .stats { display: flex; justify-content: center; gap: 2rem; margin: 1.5rem 0; }
    .stat { text-align: center; }
    .stat-num { font-size: 2rem; font-weight: 700; color: var(--accent); }
    .stat-label { font-size: 0.85rem; color: var(--subtext); }

    .tab-bar { display: flex; justify-content: center; gap: 0.5rem; margin: 1.5rem 0; }
    .tab-bar button { padding: 0.6rem 1.5rem; border: 1px solid var(--border); background: transparent;
      color: var(--text); border-radius: 8px; cursor: pointer; font-size: 0.95rem; transition: all 0.2s; }
    .tab-bar button:hover { border-color: var(--accent); }
    .tab-bar button.active { background: var(--accent); color: var(--bg); border-color: var(--accent); font-weight: 600; }

    .filter-bar { display: flex; justify-content: center; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .filter-bar button { padding: 0.4rem 1rem; border: 1px solid var(--border); background: transparent;
      color: var(--subtext); border-radius: 20px; cursor: pointer; font-size: 0.85rem; transition: all 0.2s; }
    .filter-bar button:hover { color: var(--text); border-color: var(--accent2); }
    .filter-bar button.active { background: var(--accent2); color: var(--bg); border-color: var(--accent2); }

    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 1.5rem; }
    .card { border: 1px solid var(--border); border-radius: 16px; overflow: hidden;
      background: var(--surface); transition: all 0.3s; }
    .card:hover { transform: translateY(-6px); box-shadow: 0 12px 32px rgba(0,0,0,0.5); border-color: var(--accent); }
    .card iframe { width: 100%; height: 320px; border: none; pointer-events: none; }
    .card-info { padding: 1rem 1.2rem; display: flex; justify-content: space-between; align-items: center;
      border-top: 1px solid var(--border); }
    .card-info h3 { font-size: 1rem; font-weight: 600; }
    .card-info .badge { font-size: 0.75rem; padding: 0.2rem 0.6rem; border-radius: 12px;
      background: var(--border); color: var(--subtext); }
    .card-actions { display: flex; gap: 0.5rem; }
    .card-actions a { color: var(--accent2); text-decoration: none; font-size: 0.85rem;
      padding: 0.3rem 0.8rem; border: 1px solid var(--border); border-radius: 8px; transition: all 0.2s; }
    .card-actions a:hover { background: var(--accent2); color: var(--bg); }

    .compare-controls { text-align: center; padding: 1rem; display: none; }
    .compare-controls select, .compare-controls button {
      padding: 0.5rem 1rem; font-size: 1rem; border-radius: 8px; margin: 0 0.3rem; }
    .compare-controls select { border: 1px solid var(--border); background: var(--surface); color: var(--text); }
    .compare-controls button { border: none; background: var(--accent); color: var(--bg); cursor: pointer; font-weight: 600; }
    .compare-view { display: none; }
    .compare-view.active { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .compare-view iframe { width: 100%; height: 85vh; border: 1px solid var(--border); border-radius: 12px; }
    .compare-label { text-align: center; padding: 0.5rem; font-weight: 600; color: var(--accent); font-size: 1.1rem; }

    .hidden { display: none !important; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Hookshot Docs — Theme Showcase</h1>
      <p class="subtitle">47 documentation pages rendered in 15 different themes. Browse, compare, pick your favorite.</p>
      <div class="stats">
        <div class="stat"><div class="stat-num">15</div><div class="stat-label">Themes</div></div>
        <div class="stat"><div class="stat-num">47</div><div class="stat-label">Pages</div></div>
        <div class="stat"><div class="stat-num">4</div><div class="stat-label">Catppuccin Flavors</div></div>
      </div>
    </header>

    <div class="tab-bar">
      <button class="active" onclick="showView('gallery', this)">Gallery</button>
      <button onclick="showView('compare', this)">Side-by-Side</button>
    </div>

    <div class="filter-bar" id="filter-bar">
      <button class="active" onclick="filterThemes('all', this)">All</button>
      <button onclick="filterThemes('default', this)">Default</button>
      <button onclick="filterThemes('mocha', this)">Mocha</button>
      <button onclick="filterThemes('frappe', this)">Frappé</button>
      <button onclick="filterThemes('macchiato', this)">Macchiato</button>
    </div>

    <div class="grid" id="gallery"></div>

    <div class="compare-controls" id="compare-controls">
      <select id="left-theme"></select>
      <span style="color:var(--subtext);margin:0 0.5rem;">vs</span>
      <select id="right-theme"></select>
      <select id="compare-page">
        <option value="index.html">Home</option>
        <option value="understand/event-lifecycle">Event Lifecycle</option>
        <option value="integrations/overview">Integrations</option>
        <option value="integrations/github">GitHub</option>
        <option value="architecture/connections">Connections</option>
        <option value="guides/operator/configuration">Configuration</option>
        <option value="troubleshooting/webhooks-not-arriving">Troubleshooting</option>
        <option value="get-started/quickstart">Quickstart</option>
        <option value="reference/bot-commands">Bot Commands</option>
        <option value="project/ecosystem">Ecosystem</option>
      </select>
      <button onclick="loadComparison()">Compare</button>
    </div>

    <div class="compare-view" id="compare-view">
      <div><div class="compare-label" id="left-label">Left</div><iframe id="left-frame"></iframe></div>
      <div><div class="compare-label" id="right-label">Right</div><iframe id="right-frame"></iframe></div>
    </div>
  </div>

  <script>
    const themes = [
      { name: 'default', label: 'Default VitePress', family: 'default', desc: 'Built-in VitePress theme' },
      { name: 'default-dimmed', label: 'Default (Dimmed)', family: 'default', desc: 'Softer syntax highlighting' },
      { name: 'mocha-green', label: 'Catppuccin Mocha Green', family: 'mocha', desc: 'Warm dark theme, green accent — our default' },
      { name: 'mocha-blue', label: 'Catppuccin Mocha Blue', family: 'mocha', desc: 'Warm dark theme, blue accent' },
      { name: 'mocha-mauve', label: 'Catppuccin Mocha Mauve', family: 'mocha', desc: 'Warm dark theme, purple accent' },
      { name: 'mocha-pink', label: 'Catppuccin Mocha Pink', family: 'mocha', desc: 'Warm dark theme, pink accent' },
      { name: 'mocha-sapphire', label: 'Catppuccin Mocha Sapphire', family: 'mocha', desc: 'Warm dark theme, sapphire accent' },
      { name: 'mocha-lavender', label: 'Catppuccin Mocha Lavender', family: 'mocha', desc: 'Warm dark theme, lavender accent' },
      { name: 'frappe-green', label: 'Catppuccin Frappé Green', family: 'frappe', desc: 'Mid-tone dark theme, green accent' },
      { name: 'frappe-blue', label: 'Catppuccin Frappé Blue', family: 'frappe', desc: 'Mid-tone dark theme, blue accent' },
      { name: 'frappe-mauve', label: 'Catppuccin Frappé Mauve', family: 'frappe', desc: 'Mid-tone dark theme, purple accent' },
      { name: 'macchiato-green', label: 'Catppuccin Macchiato Green', family: 'macchiato', desc: 'Cool dark theme, green accent' },
      { name: 'macchiato-blue', label: 'Catppuccin Macchiato Blue', family: 'macchiato', desc: 'Cool dark theme, blue accent' },
      { name: 'macchiato-lavender', label: 'Catppuccin Macchiato Lavender', family: 'macchiato', desc: 'Cool dark theme, lavender accent' },
      { name: 'macchiato-peach', label: 'Catppuccin Macchiato Peach', family: 'macchiato', desc: 'Cool dark theme, peach accent' },
    ];

    const previewPages = [
      'integrations/github', 'understand/event-lifecycle', 'architecture/connections',
      'get-started/quickstart', 'integrations/overview'
    ];
    // Random preview page per card for variety
    function previewPage(i) { return previewPages[i % previewPages.length]; }

    const gallery = document.getElementById('gallery');
    themes.forEach((t, i) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.dataset.family = t.family;
      card.innerHTML = `
        <iframe src="${t.name}/${previewPage(i)}" loading="lazy"></iframe>
        <div class="card-info">
          <div>
            <h3>${t.label}</h3>
            <span class="badge">${t.family}</span>
          </div>
          <div class="card-actions">
            <a href="${t.name}/index.html" target="_blank">Browse</a>
          </div>
        </div>`;
      gallery.appendChild(card);
    });

    const leftSel = document.getElementById('left-theme');
    const rightSel = document.getElementById('right-theme');
    themes.forEach((t, i) => {
      leftSel.innerHTML += `<option value="${t.name}" ${i===2?'selected':''}>${t.label}</option>`;
      rightSel.innerHTML += `<option value="${t.name}" ${i===0?'selected':''}>${t.label}</option>`;
    });

    function showView(view, btn) {
      document.querySelectorAll('.tab-bar button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      gallery.style.display = view === 'gallery' ? 'grid' : 'none';
      document.getElementById('filter-bar').style.display = view === 'gallery' ? 'flex' : 'none';
      document.getElementById('compare-view').className = view === 'compare' ? 'compare-view active' : 'compare-view';
      document.getElementById('compare-controls').style.display = view === 'compare' ? 'block' : 'none';
      if (view === 'compare') loadComparison();
    }

    function filterThemes(family, btn) {
      document.querySelectorAll('.filter-bar button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.card').forEach(card => {
        card.classList.toggle('hidden', family !== 'all' && card.dataset.family !== family);
      });
    }

    function loadComparison() {
      const left = leftSel.value, right = rightSel.value;
      const page = document.getElementById('compare-page').value;
      document.getElementById('left-frame').src = `${left}/${page}`;
      document.getElementById('right-frame').src = `${right}/${page}`;
      document.getElementById('left-label').textContent = leftSel.options[leftSel.selectedIndex].text;
      document.getElementById('right-label').textContent = rightSel.options[rightSel.selectedIndex].text;
    }
  </script>
</body>
</html>
HTMLEOF

echo "✅ Theme comparison page: $OUTPUT_BASE/themes/index.html"
echo "   Open in browser or serve with: npx serve $OUTPUT_BASE/themes"
