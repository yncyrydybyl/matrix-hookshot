# Documentation Tooling & Automation Strategy

---

## 1. Failure Analysis

### How documentation breaks over time

| Failure mode | How it happens | Why hard to detect | Impact on trust |
|---|---|---|---|
| **Technical drift** | Code changes, docs don't update. A config key is renamed, a handler removed, an event type added. | No automated link between code and docs. PR reviewers focus on code, not docs. | Reader follows docs, gets an error. Immediate trust loss. |
| **Structural drift** | New pages don't follow the template. Sections get added ad-hoc. Naming conventions ignored. | No schema validation for page structure. Inconsistency accumulates gradually. | Site feels disorganized. Readers can't predict where to find things. |
| **Outdated examples** | Config examples reference old keys. API call examples use deprecated endpoints. Payload formats change. | Examples aren't executed. They're strings in markdown, not tested code. | Reader copies example, it fails. Most damaging failure mode. |
| **Broken links** | Pages renamed, headings changed, external URLs moved. | No one clicks every link. Internal restructuring breaks cross-references silently. | Dead links signal abandonment. |
| **Missing integrations** | New connection type added to code, no docs written. | No coverage check. Code PRs don't require doc PRs. | Feature is invisible to users. |
| **Partial documentation** | Page exists but is incomplete. "TODO" markers, empty sections, placeholder text. | Partially-written pages look complete in the sidebar. | Reader navigates to page, finds nothing useful. |
| **Copy-paste divergence** | Same concept explained in 3 places. One gets updated, others don't. | No single source of truth enforcement. grep catches exact matches but not paraphrases. | Contradictory information. Reader doesn't know which to trust. |
| **Undocumented features** | Feature implemented but never written up. Emoji reactions in GitHub integration, for example. | No inventory check comparing code features to documented features. | Power users discover features by reading source code. Others never find them. |
| **Stale external references** | GitHub changes their API docs URL. Matrix spec section renamed. | External URL checks catch 404s but not moved content. | Links go nowhere or to wrong content. |

---

## 2. Automation Strategy

### Per-failure-type response

| Failure | Automated detection | Automated prevention | Manual fallback |
|---|---|---|---|
| Technical drift | CI: grep referenced file paths in docs, check they exist | PR template: "Does this change affect docs?" checkbox | Quarterly doc-code audit |
| Structural drift | CI: validate frontmatter schema, check required sections per page type | PR lint: `markdownlint` + custom rules | Template review in PR |
| Outdated examples | CI: validate config examples against schema, test API examples | Generate config reference from `@configKey` decorators | Manual review of examples quarterly |
| Broken links | CI: `lychee` link checker (internal + external) | Pre-commit hook for internal links | Weekly external link check |
| Missing integrations | CI: compare `src/Connections/` file list to `docs/integrations/` file list | PR bot comment: "New connection type detected, no docs found" | Track in issue per integration |
| Partial docs | CI: check required sections present per page type template | Minimum content length per section | Review checklist |
| Copy-paste divergence | N/A (hard to automate) | Single source of truth: concept pages linked from integration pages, never duplicated | Review guideline: "link, don't repeat" |
| Undocumented features | CI: extract `@botCommand` count vs documented commands count | Generate reference pages from code decorators | Feature inventory audit |
| Stale external refs | Weekly CI: external link checker with status reporting | Pin to versioned external URLs where possible | Manual review of flagged links |

---

## 3. Documentation as Code Model

### Repo structure

Docs live in the same repo as code (current: `docs/`, proposed: keep in-repo).

```
matrix-hookshot/
├── docs/                          # Documentation source
│   ├── understand/
│   ├── get-started/
│   ├── guides/
│   ├── integrations/
│   ├── architecture/
│   ├── reference/
│   ├── troubleshooting/
│   ├── recipes/
│   ├── external-references/
│   ├── project/
│   ├── assets/
│   └── SUMMARY.md                 # Navigation (mdBook) or sidebar config
├── scripts/
│   ├── build-metrics-docs.ts      # Existing: generates metrics.md
│   ├── build-config-docs.ts       # New: generates config reference
│   ├── build-commands-docs.ts     # New: generates bot commands reference
│   └── build-events-docs.ts       # New: generates event types reference
└── .github/
    └── workflows/
        ├── docs-latest.yml        # Existing: build + deploy docs on push to main
        ├── docs-release.yml       # Existing: versioned release docs
        └── docs-lint.yml          # New: lint + validate on PR
```

**Why in-repo:** Code changes and doc changes should be in the same PR. Separate repos create drift by design.

### Versioning strategy

- `docs-latest.yml` publishes from `main` → latest docs (current behavior)
- `docs-release.yml` publishes tagged releases → versioned docs (current behavior)
- Breaking changes: doc migration notes in `docs/project/upgrading.md`

### Branching model

- Doc changes go on the same branch as code changes
- Doc-only changes: branch from `main`, small PRs
- Large restructuring: tracked as GitHub issue, can span multiple PRs

### Review process

- PRs touching `docs/` require review from a docs-aware maintainer
- Add to `CODEOWNERS`:
  ```
  /docs/ @hookshot-docs-team
  /scripts/build-*-docs.ts @hookshot-docs-team
  ```
- PR template includes: "Documentation: [ ] Updated [ ] Not needed [ ] New page created"

### Quality enforcement in PRs

MUST (CI-enforced):
- Frontmatter validates against schema
- Internal links resolve
- Required sections present per page type
- No broken Mermaid diagrams
- markdownlint passes

SHOULD (reviewer-enforced):
- Evidence blocks present
- External links annotated
- Code references accurate
- Tone matches editorial rules

---

## 4. Structured Metadata System

### Frontmatter schema

```yaml
---
title: "Page Title"                     # REQUIRED
description: "One-line description"     # REQUIRED
audience:                               # REQUIRED, one or more
  - user | operator | developer | contributor | architect | evaluator
integration: github                     # OPTIONAL, service slug
component: connections                  # OPTIONAL, system component
feature: webhooks                       # OPTIONAL, feature area
status: current | draft | deprecated    # REQUIRED, default "current"
last_verified: "2026-04-01"            # OPTIONAL, for time-sensitive content
generated_from: "src/Metrics.ts"        # OPTIONAL, for auto-generated pages
prereqs:                                # OPTIONAL, for tutorials
  - understand/connections.md
time: "5 minutes"                       # OPTIONAL, for tutorials
---
```

### Validation

CI script validates:
```typescript
// scripts/validate-frontmatter.ts
const REQUIRED_FIELDS = ['title', 'description', 'audience', 'status'];
const VALID_AUDIENCES = ['user', 'operator', 'developer', 'contributor', 'architect', 'evaluator'];
const VALID_STATUSES = ['current', 'draft', 'deprecated'];
const VALID_INTEGRATIONS = ['github', 'gitlab', 'jira', 'webhooks', 'feeds', 'figma', 'openproject', 'challengehound'];
```

### How metadata is used

- **Navigation filtering:** Sidebar can group by audience or integration
- **Staleness detection:** `last_verified` older than 6 months → CI warning
- **Coverage reporting:** Which integrations have docs? Which audiences are underserved?
- **Search facets:** Tag-based filtering in search results

---

## 5. Evidence Enforcement

### Required evidence per page type

| Page type | Code ref | Config example | Payload example | Spec link | External link |
|---|---|---|---|---|---|
| Concept | SHOULD | OPTIONAL | OPTIONAL | MUST (where relevant) | OPTIONAL |
| Integration | MUST | MUST | MUST | MUST | MUST |
| Operator guide | OPTIONAL | MUST | N/A | OPTIONAL | OPTIONAL |
| Tutorial | OPTIONAL | MUST | MUST | N/A | OPTIONAL |
| Reference | MUST (source file) | MUST | MUST (where relevant) | MUST | MUST |
| Troubleshooting | OPTIONAL | MUST (diagnostic) | OPTIONAL | N/A | N/A |

### CI enforcement

```typescript
// scripts/validate-evidence.ts
const INTEGRATION_REQUIRED_SECTIONS = [
  'Capabilities',
  'How it works',
  'Authentication',
  'Setup',
  'Bot commands',
  'Limitations',
  'Upstream references',
  'Related',
];

// Check: integration pages must contain at least one code reference
// Pattern: [Code: src/...] or ```yaml (config example)
```

### Lint rules (custom markdownlint)

- `hookshot/evidence-block`: Integration pages must contain `[Code:` pattern
- `hookshot/upstream-refs`: Integration pages must contain `## Upstream references`
- `hookshot/limitations`: Integration pages must contain `## Limitations`
- `hookshot/related`: All pages must contain `## Related`

---

## 6. Example Validation System

### What exists today

- `scripts/build-metrics-docs.ts` — generates `docs/metrics.md` from `prom-client` registry
  - Imports `Metrics` singleton, reads registered metrics, outputs markdown table
  - [Code: `scripts/build-metrics-docs.ts:1-30`]
- This is the ONLY auto-generated doc page currently

### What to build

**Config reference generation:**
```typescript
// scripts/build-config-docs.ts
// Extract @configKey decorators from src/config/*.ts
// Output: docs/reference/configuration.md
// Approach: Parse TypeScript AST, extract decorator metadata + JSDoc
```

Source: 35 `@configKey` usages across `src/config/Config.ts`, `src/config/sections/GitHub.ts`, `src/config/sections/Jira.ts`, `src/config/sections/Gitlab.ts`, etc.

**Bot commands generation:**
```typescript
// scripts/build-commands-docs.ts
// Extract @botCommand decorators from all Connection files
// Output: docs/reference/bot-commands.md
// Approach: Parse decorator arguments (prefix, help, requiredArgs, optionalArgs)
```

Source: 66 `@botCommand` usages across 12 files (`src/Connections/GithubRepo.ts`, `src/AdminRoom.ts`, `src/Connections/SetupConnection.ts`, etc.)

**Event types generation:**
```typescript
// scripts/build-events-docs.ts
// Grep for uk.half-shot.matrix-hookshot.* strings
// Output: docs/reference/event-types.md
```

**Config example validation:**
```typescript
// scripts/validate-config-examples.ts
// Extract YAML code blocks from docs
// Parse and validate against BridgeConfigRoot schema
// Report: which examples have invalid keys
```

### Snapshot testing for payloads

- Store example payloads as JSON in `docs/assets/payloads/`
- CI: validate payload JSON is parseable
- NICE-TO-HAVE: validate against webhook schemas (e.g., `@octokit/webhooks` types for GitHub)

---

## 7. External Dependency Monitoring

### What to track

| Dependency | Current version | Track for |
|---|---|---|
| GitHub API | REST v3, GraphQL | Endpoint deprecations, webhook event changes |
| GitLab API | v4 | API version changes |
| JIRA API | v2 (server), v3 (cloud) | Server EOL changes, cloud API changes |
| Figma API | v2 | SDK deprecation, new webhook events |
| Matrix spec | latest | New MSCs affecting appservice API |
| Octokit | v20 | Breaking version bumps |
| matrix-appservice-bridge | v11 | Breaking version bumps |

### Monitoring approach

**MUST (MVP):**
- `renovate.json` already exists — tracks dependency updates. Extend to flag docs-relevant updates.
- Quarterly manual review of external API changelogs

**NICE-TO-HAVE:**
- GitHub Action that checks external doc URLs monthly, reports broken ones
- RSS feed monitoring for Matrix spec changes (`matrix.org/blog` feed)

### Update triggers

When a dependency bumps in `package.json` or `Cargo.toml`:
- CI comment: "This updates {package}. Check if docs/integrations/{service}.md needs updating."

---

## 8. Link Integrity System

### Internal links

**Tool:** `lychee` (Rust-based, fast, supports markdown)

```yaml
# .github/workflows/docs-lint.yml
- name: Check internal links
  run: lychee --no-progress docs/**/*.md --include-fragments
```

Runs on every PR. Blocks merge if internal links are broken.

### External links

**Tool:** `lychee` with external checking enabled

```yaml
# .github/workflows/docs-links.yml (weekly)
- name: Check external links
  run: lychee --no-progress docs/**/*.md --accept 200,301,302 --timeout 30
```

Runs weekly on a schedule. Creates issue if links are broken.

### Fallback for dead links

- External links include annotation: `[GitHub Webhooks docs](url) — webhook event reference`
- If URL dies, annotation tells reader what to search for
- `external-references/` pages serve as curated link collections — single place to update

---

## 9. Integration Scalability Model

### Template enforcement

Every integration page must match the template structure. CI validates:

```typescript
// scripts/validate-integration-pages.ts
const REQUIRED_H2_SECTIONS = [
  'Capabilities', 'How it works', 'Supported events', 'Authentication',
  'Setup', 'Bot commands', 'Limitations', 'Upstream references', 'Related'
];

for (const file of glob('docs/integrations/*.md')) {
  const headings = extractH2Headings(file);
  for (const required of REQUIRED_H2_SECTIONS) {
    if (!headings.includes(required)) {
      fail(`${file}: missing required section "${required}"`);
    }
  }
}
```

### Preventing duplication

- Shared concepts (connections, events, auth model) live in `understand/` — integration pages LINK, never repeat
- Shared config patterns (listeners, permissions) live in `guides/operator/` — integration setup pages reference them
- Bot command reference is auto-generated — integration pages show examples, reference page has the full list

### Adding a new integration

Documented checklist in `docs/architecture/extensibility.md`:
1. Create connection class in `src/Connections/`
2. Copy integration template from `doc/DOCUMENTATION_ARCHITECTURE.md` section 6
3. Fill all required sections
4. Add to `integrations/overview.md` capability matrix
5. Add integration slug to frontmatter validation list
6. CI will verify template compliance

---

## 10. Tooling Recommendations

### Documentation framework

**Recommendation: VitePress**

| Framework | Pros | Cons | Verdict |
|---|---|---|---|
| **mdBook** (current) | Simple, Rust-based, fast | No component system, limited theming, no search facets, no versioning plugin | Replace |
| **Docusaurus** | Versioning, search, React components | Heavy, React dependency, slow builds | Overkill |
| **VitePress** | Fast, Vue components, TypeScript-native, good search, sidebar generation, frontmatter support | Vue dependency | **Best fit** |
| **Mintlify** | Beautiful out-of-box, API reference generation | Hosted/SaaS, less control | Not suitable for OSS |

**Why VitePress:**
- Project is TypeScript — VitePress is TypeScript-native
- Fast builds (Vite)
- Built-in search (MiniSearch)
- Frontmatter-driven sidebar generation
- Mermaid plugin available
- Version dropdown via git tags
- Custom Vue components for integration capability tables, evidence blocks, etc.

**Migration effort:** Medium. Markdown is markdown — mostly sidebar config changes and frontmatter additions.

### Linting

**MUST:**
- `markdownlint-cli2` with `.markdownlint.yml` config
- Custom rules for hookshot-specific patterns (evidence blocks, required sections)

**Config:**
```yaml
# .markdownlint.yml
MD013: false      # Line length — too annoying for docs
MD033: false      # Allow inline HTML (for callouts, badges)
MD041: false      # First line doesn't need to be heading (frontmatter)
```

### CI/CD pipelines

```yaml
# .github/workflows/docs-lint.yml
name: Docs Lint
on: pull_request
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx markdownlint-cli2 "docs/**/*.md"
      - run: npx ts-node scripts/validate-frontmatter.ts
      - run: npx ts-node scripts/validate-integration-pages.ts
      - run: lychee --no-progress docs/**/*.md --include-fragments
      - run: npx ts-node scripts/validate-config-examples.ts
```

### Content generation

| What | Source | Script | Output |
|---|---|---|---|
| Metrics reference | `src/Metrics.ts` via prom-client | `scripts/build-metrics-docs.ts` (exists) | `docs/reference/metrics.md` |
| Config reference | `src/config/*.ts` via `@configKey` | `scripts/build-config-docs.ts` (new) | `docs/reference/configuration.md` |
| Bot commands | `src/**/*.ts` via `@botCommand` | `scripts/build-commands-docs.ts` (new) | `docs/reference/bot-commands.md` |
| Event types | `src/Connections/*.ts` state types | `scripts/build-events-docs.ts` (new) | `docs/reference/event-types.md` |
| API reference | `src/widgets/BridgeWidgetApi.ts` | `scripts/build-api-docs.ts` (new) | `docs/reference/provisioning-api.md` |

### Diagrams

- **Mermaid** for all diagrams (inline in markdown or `.mmd` files)
- `mermaid-cli` (`mmdc`) for CI rendering validation
- Shared Mermaid theme in `docs/.vitepress/mermaid.config.ts`

---

## 11. What to Keep / Extend / Replace

| Current | Decision | Reason |
|---|---|---|
| mdBook | **Replace** with VitePress | Limited theming, no versioning, no component system, no search facets |
| `docs/` directory | **Keep** location, restructure contents | In-repo docs is correct |
| `docs/SUMMARY.md` | **Replace** with VitePress sidebar config | VitePress generates sidebar from file structure + frontmatter |
| `docs/_site/` (CSS/JS) | **Replace** with VitePress theme | Custom CSS is minimal and mdBook-specific |
| `scripts/build-metrics-docs.ts` | **Keep and extend** pattern | Working model for auto-generation. Build similar scripts for config, commands, events. |
| `docs-latest.yml` workflow | **Extend** with lint step | Add validation before build |
| `book.toml` | **Remove** after migration | mdBook config |
| `changelog.d/` + `newsfile.yml` | **Keep** | Changelog generation is separate from docs |
| Existing doc content | **Migrate** to new structure | Content is usable, structure is not |

---

## 12. Governance Model

### Ownership

| Area | Owner | Responsibility |
|---|---|---|
| Doc structure + templates | Docs lead (or maintainer) | Approve structural changes, template updates |
| Integration pages | Integration maintainer | Keep their integration page current |
| Reference pages | Auto-generated + docs lead | Ensure generation scripts work |
| Architecture pages | Core maintainers | Update when architecture changes |
| Tutorials + get-started | Docs lead | Ensure they work with current version |

### Review rules

- **Doc-only PRs:** 1 reviewer (docs lead or any maintainer)
- **Code + docs PRs:** Code reviewer checks code, docs lead checks docs
- **Structural changes** (new sections, template changes): 2 reviewers
- **Auto-generated pages:** Review the script, not the output

### Quality enforcement

- CI gates: lint, links, frontmatter, required sections (automated, blocks merge)
- Review checklist: evidence, tone, accuracy (manual, enforced by reviewer)
- Quarterly audit: check `last_verified` dates, run full external link check, compare feature inventory to docs

---

## 13. MVP vs Ideal

### MVP (implement in 1-2 weeks)

MUST:
- [ ] Restructure `docs/` to new hierarchy (move existing files)
- [ ] Add frontmatter to all existing pages
- [ ] Add `markdownlint` config + CI check
- [ ] Add `lychee` internal link check in CI
- [ ] Extend `scripts/build-metrics-docs.ts` pattern: add `build-commands-docs.ts`
- [ ] Write 3 hero pages: `event-lifecycle`, `integrations/overview`, `architecture/connections`
- [ ] Add CODEOWNERS for `docs/`
- [ ] Add PR template with docs checkbox

SHOULD:
- [ ] Write `validate-frontmatter.ts` CI check
- [ ] Write `validate-integration-pages.ts` CI check
- [ ] Migrate from mdBook to VitePress

### Ideal (implement over 2-3 months)

NICE-TO-HAVE:
- [ ] Full auto-generation: config, commands, events, API reference
- [ ] Config example validation against schema
- [ ] Automated screenshot pipeline (Playwright + docker-compose)
- [ ] External link checker on weekly schedule
- [ ] Coverage report: code features vs documented features
- [ ] Mermaid diagram validation in CI
- [ ] `last_verified` staleness alerting
- [ ] Search faceting by audience and integration

---

## 14. Example Pipeline: Adding a New Integration

Developer adds `FooBarConnection` to `src/Connections/FooBar.ts`:

### What happens automatically

1. **CI detects new connection file** — `validate-integration-pages.ts` compares `src/Connections/` to `docs/integrations/`. Finds `FooBar.ts` with no matching `docs/integrations/foobar.md`. CI **warns** (not blocks — don't block code PRs on docs).

2. **Bot comments on PR:** "New connection type `FooBarConnection` detected. Documentation needed at `docs/integrations/foobar.md`. Use the [integration template](doc/DOCUMENTATION_ARCHITECTURE.md#6-integration-documentation-model)."

3. **Developer creates `docs/integrations/foobar.md`** from template.

4. **CI validates the new page:**
   - Frontmatter valid? (title, description, audience, integration=foobar, status) → PASS/FAIL
   - Required sections present? (Capabilities, How it works, Auth, Setup, etc.) → PASS/FAIL
   - Internal links resolve? → PASS/FAIL
   - Markdown lint passes? → PASS/FAIL
   - Integration slug added to `integrations/overview.md` capability matrix? → WARN if missing

5. **Reviewer sees:** Green CI checks + structured doc page following template.

### What fails if incomplete

| Missing | CI result |
|---|---|
| No doc page at all | Warning comment, not blocking |
| Page exists but missing required sections | **FAIL** |
| Invalid frontmatter | **FAIL** |
| Broken internal links | **FAIL** |
| Missing from capability matrix | Warning |
| No code references | Warning (reviewer-enforced) |
| No upstream references | Warning (reviewer-enforced) |

---

## 15. Final Summary

### How this prevents decay

- **Auto-generation** for reference pages (metrics, commands, config, events) — they can't drift because they're built from code
- **CI validation** for structure (frontmatter, required sections, links) — structural drift is caught before merge
- **Link checking** (internal: every PR, external: weekly) — broken links are detected
- **Coverage tracking** (connection types vs doc files) — missing docs are surfaced
- **CODEOWNERS** — docs changes get reviewed by docs-aware people

### Why it works in 1-2 years

- Simple tools (`markdownlint`, `lychee`, custom TypeScript scripts) — no complex infrastructure to maintain
- Auto-generation scripts follow the existing `build-metrics-docs.ts` pattern — proven approach
- CI checks are fast (seconds, not minutes) — developers won't disable them
- Governance is lightweight — quarterly audits, not daily overhead

### Remaining risks

- **External API changes** without clear monitoring — mitigated by quarterly review but not fully automated
- **Prose quality** can't be automated — depends on reviewer discipline
- **Screenshot freshness** in MVP is manual — automated pipeline is Ideal-tier
- **VitePress migration** is a one-time effort that could block other work if not prioritized
- **Template compliance** for existing pages requires retrofit effort
