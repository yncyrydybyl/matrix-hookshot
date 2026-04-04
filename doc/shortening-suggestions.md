# Shortening Suggestions

Content audit of 47 documentation pages (6,207 lines total).
Goal: cut ~20% without losing information.

---

## 1. Structural duplication (highest impact)

### overview.md duplicates individual integration pages

`integrations/overview.md` lines 50-156 contain per-service summaries (GitHub, GitLab, JIRA, etc.) that duplicate the opening sections of each individual integration page.

**Current:** 107 lines of per-service prose in overview.md
**Suggestion:** Replace with a one-line description per service linking to the full page. The capability matrix table already serves the overview purpose.

**Estimated savings:** ~80 lines

### what-is-hookshot.md "Next steps" duplicates "Related"

Lines 111-126: "Next steps" table and "Related" section link to the same pages.

**Suggestion:** Keep "Next steps" (more useful for new readers), remove "Related" section.

**Estimated savings:** ~8 lines (per page — this pattern repeats on many pages)

### integration-model.md overlaps with architecture/connections.md

Both pages explain the Connection abstraction, lifecycle, and creation methods. integration-model.md is the user-facing version, connections.md is the contributor-facing version.

**Suggestion:** Keep both but remove the lifecycle detail from integration-model.md (link to connections.md for depth). Cut lines 38-55 to a shorter version.

**Estimated savings:** ~15 lines

### event-lifecycle.md repeats bot commands from reference/bot-commands.md

Lines 161-170: "Available commands by service" table repeats content from the auto-generated bot commands reference.

**Suggestion:** Replace table with a link: "See [Bot Commands Reference](../reference/bot-commands.md) for the complete list."

**Estimated savings:** ~12 lines

---

## 2. Verbose sections (medium impact)

### architecture/connections.md — ConnectionManager section

Lines 209-221: The ConnectionManager description lists 5 methods with descriptions. This is reference material, not architectural explanation.

**Suggestion:** Reduce to 2 sentences + link to source code. The provisioning-api.md already covers the API surface.

**Estimated savings:** ~10 lines

### guides/operator/configuration.md — too much inline documentation

At 310 lines, this is the longest operator guide. Several sections duplicate the config.sample.yml comments.

**Suggestion:**
- Remove the JSON log schema example (lines 46-57) — most operators don't need this
- Shorten the permissions example (lines 155-174) — one example is enough, currently has two
- Remove the nginx reverse proxy example (lines 108-118) — link to a recipe instead

**Estimated savings:** ~40 lines

### guides/operator/installation.md — registration file shown twice

The registration.yml content appears both in installation.md and in the inline example. 

**Suggestion:** Show it once with a link to registration.sample.yml.

**Estimated savings:** ~15 lines

### architecture/state-and-storage.md — interface code block

Lines 96-117: Full IBridgeStorageProvider interface listing. This is source code that belongs in the repo, not docs.

**Suggestion:** Replace with a 2-line summary + source link.

**Estimated savings:** ~18 lines

### architecture/extensibility.md — full code skeleton

Lines 20-82: 62-line TypeScript code skeleton for a new connection. Useful but long.

**Suggestion:** Shorten to a 20-line minimal skeleton showing only required methods. Link to GenericHook.ts as the real-world reference.

**Estimated savings:** ~35 lines

---

## 3. Per-page wording issues

### Filler transitions to cut

These patterns appear across many pages and can be removed:

| Pattern | Count | Action |
|---|---|---|
| "This page explains..." / "This page walks through..." | ~8 | Cut — the heading already says what the page is about |
| "See [X] for more details" after already linking in the sentence | ~5 | Remove redundant "see X" |
| "For a more detailed view..." + link | ~4 | Just the link is enough |
| Empty ## headings followed by content | ~3 | Merge with surrounding text |

### Overly cautious language

| Current | Shorter |
|---|---|
| "This is hookshot's most distinctive architectural choice." | Cut entirely — let the reader judge |
| "Understanding these two flows explains most of hookshot's behavior." | Cut — redundant with the heading |
| "This is the same flow that all hookshot integrations use." | Cut — already explained above |
| "A reader who understands the model can predict behavior they haven't seen documented." | Cut — editorial, not documentation |

### Repeated explanations

| Content | Appears in | Action |
|---|---|---|
| "Connections are stored as Matrix room state events" | what-is-hookshot, integration-model, connections, event-lifecycle, overview, configuration | Keep in integration-model + connections, cut from others (link instead) |
| "No external database required" | what-is-hookshot, connections, evaluate, state-and-storage | Keep in connections + evaluate, cut from others |
| "15 connection types across 8 services" | what-is-hookshot, overview, connections | Keep in overview, cut from others |
| "QuickJS sandbox" explanation | generic-webhooks, trust-and-boundaries, hardening | Keep full version in generic-webhooks, shorten in others |

---

## 4. Sections that could be removed entirely

| Page | Section | Lines | Reason |
|---|---|---|---|
| overview.md | Per-service prose (GitHub through ChallengeHound) | ~95 | Duplicates individual pages; capability matrix + connection types table is sufficient |
| overview.md | "How connections are created" | ~14 | Already covered in integration-model.md and connections.md |
| evaluate.md | "Architecture fit" ASCII diagram | ~12 | The what-is-hookshot.md Mermaid diagram is better |
| what-is-hookshot.md | "Technology" section | ~6 | Useful but could move to architecture/component-model.md |
| architecture/component-model.md | ASCII diagram | ~25 | Hard to read, the text descriptions below are clearer |

---

## 5. Related sections audit

Every page has a "Related" section. Some are too long (10+ links) and repeat what's in the sidebar.

**Suggestion:** Max 6 links per Related section. Remove links that are already in the sidebar navigation.

**Estimated savings:** ~60 lines across all pages

---

## Summary

| Category | Estimated line savings |
|---|---|
| Structural duplication | ~115 lines |
| Verbose sections | ~118 lines |
| Filler wording | ~40 lines |
| Removable sections | ~152 lines |
| Related section trimming | ~60 lines |
| **Total** | **~485 lines (~8% of 6,207)** |

## Priority order

1. **overview.md per-service prose** — highest impact, clearest duplication
2. **configuration.md trimming** — too long for operators who just want to get running
3. **Related section consistency** — reduce to max 6 links everywhere
4. **Filler wording pass** — remove "This page explains..." patterns
5. **Code skeleton shortening** — extensibility.md, state-and-storage.md
