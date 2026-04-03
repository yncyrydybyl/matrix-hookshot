# Documentation Architecture Review

Editorial review of `DOCUMENTATION_ARCHITECTURE.md` — grounded in the actual codebase and current docs.

---

## 1. Editorial Philosophy

**How this differs from typical OSS docs:**
- Structure-first: teaches the system model before showing config
- Evidence-required: every claim must trace to code, spec, or external docs
- Audience-separated: no single page serves everyone poorly

**What will be avoided:**
- Config dumps without context
- Idealized descriptions that don't match code behavior
- Duplicated explanations across integration pages
- Unmarked assumptions

**What will be enforced:**
- Every page declares its audience in frontmatter
- Every integration page uses the same template
- Claims include `[Code reference]` or are marked `[Assumption]`
- Limitations are stated, not hidden

---

## 2. Reality Check of Current State

Current docs live in `docs/` and are built with mdBook (`book.toml`).

### Where readers get lost

- **Setup pages mix operator and user concerns.** `docs/setup/github.md` (97 lines) covers GitHub App creation, webhook config, YAML config, AND OAuth — four distinct tasks for two different people on one page.
- **No mental model.** A reader arrives at `docs/setup/github.md` without understanding what a "connection" is, how webhooks route to rooms, or what state events do. The setup page assumes knowledge it never provides.
- **Usage docs are sparse.** `docs/usage/room_configuration/github_repo.md` (76 lines) is mostly a config options table. No event flow, no example messages, no troubleshooting.
- **Only 3 of 8 integrations have room configuration docs** (GitHub, GitLab, JIRA). Feeds, webhooks, Figma, OpenProject, ChallengeHound have setup docs but no usage docs.

### Where truth is unclear

- **15 connection types exist in code** (`src/Connections/`), but docs don't enumerate them. A reader can't know what's possible.
- **23 GitHub event types are configurable** (`src/Connections/GithubRepo.ts:144-170`), but docs list only event names without explaining what each produces in Matrix.
- **Emoji reactions trigger GitHub actions** (close, reopen, approve PR) — completely undocumented.
- **Legacy state event types** (e.g., `uk.half-shot.matrix-github.repository`) exist alongside current ones — migration path undocumented.
- **The provisioning API** (`src/widgets/BridgeWidgetApi.ts:28-122`) has 12 endpoints — none documented as API reference.

### Where structure fails

- **`docs/SUMMARY.md` has 3 levels** but no conceptual foundation. It jumps from "Hookshot" overview straight to "Setup."
- **No troubleshooting beyond one page.** `docs/troubleshooting.md` is a single file for all problems.
- **No reference section.** Config, commands, metrics, event types — all undocumented as reference material.
- **Advanced section is a grab-bag.** Workers, encryption, widgets, service bots — unrelated topics grouped by "not basic."

---

## 3. Target Structure Assessment

### What works in the proposed structure

- **`understand/` section is the right call.** The current docs' biggest gap is the missing mental model. Teaching connections, event lifecycle, and trust boundaries before anything else is correct.
- **Separation of `guides/user/`, `guides/operator/`, `guides/developer/`** directly addresses the current problem of mixed audiences.
- **`integrations/` with a uniform template** prevents the current inconsistency (GitHub has 2 doc pages, Figma has 1, feeds has 1).
- **`reference/` section is overdue.** Config, commands, metrics, and event types are all extractable from code and should be lookup-optimized.
- **`troubleshooting/` as symptom-indexed pages** replaces the current single-page catch-all.

### What needs attention

- **`understand/` has 7 pages — may be too many before readers reach anything actionable.** Consider: `what-is-hookshot.md` + `how-it-works.md` could merge. `system-components.md` overlaps with `architecture/component-model.md`.
  - Recommendation: 4-5 concept pages max. Merge `what-is-hookshot` + `how-it-works`. Drop `system-components` (it belongs in `architecture/`).

- **`integrations/` uses flat files (github.md, gitlab.md)** but GitHub alone has 6 connection types. A flat file will be 500+ lines.
  - Recommendation: Allow subdirectories for complex integrations: `integrations/github/index.md`, `integrations/github/repos.md`, `integrations/github/issues.md`. Keep flat files for simple ones (feeds, figma).

- **`external-references/` may not earn its existence.** Curated links are valuable but a standalone section may go unvisited. External links work better inline + in integration page footers.
  - Recommendation: Demote to a single `reference/external-links.md` page or merge into integration pages.

- **`recipes/` vs `guides/` boundary is fuzzy.** "Bridge a GitHub org" is both a recipe and a guide.
  - Recommendation: Recipes are multi-integration or compound tasks. Guides are single-feature. Make this explicit.

### Overlap check

| Page A | Page B | Overlap | Resolution |
|---|---|---|---|
| `understand/system-components` | `architecture/component-model` | High | Drop from understand/ |
| `understand/trust-and-boundaries` | `architecture/authentication-flows` | Medium | understand/ = concept, architecture/ = implementation |
| `guides/operator/configuration` | `reference/configuration` | Medium | guide = walkthrough, reference = lookup. Clear. |
| `integrations/github` setup section | `guides/operator/` | Low | Integration setup is service-specific; operator guide is general |

---

## 4. Evidence Model

### Required evidence by page type

| Page type | Code refs | Config examples | Payloads | Spec links | External links |
|---|---|---|---|---|---|
| Concept | Required | Optional | Optional | Required where relevant | Optional |
| Integration | Required | Required | Required | Required | Required |
| Operator guide | Optional | Required | N/A | Optional | Optional |
| User guide | Optional | Required (commands) | Optional | N/A | N/A |
| Reference | Required (source file) | Required | Required where relevant | Required | Required |
| Troubleshooting | Optional | Required (diagnostic) | Optional | N/A | N/A |
| Tutorial | Optional | Required | Required | N/A | Optional |

### How evidence is displayed

```markdown
<!-- Inline code reference -->
[Code: src/Connections/GithubRepo.ts:144-170]

<!-- Inline spec reference -->
[Matrix Spec: Application Service API](https://spec.matrix.org/latest/application-service-api/)

<!-- Evidence block for claims -->
> **Source:** Observed in `src/Bridge.ts:319-325` — `bindHandlerToQueue` maps
> `github.issues.opened` to `GitHubRepoConnection.onIssueCreated()`.
```

### Keeping evidence current

- Code references include file + line range. CI can check if referenced files still exist.
- Config examples are extracted from `config.sample.yml` or tested against schema.
- Payload examples are stored as JSON in `assets/payloads/` and validated in CI.
- External links are checked weekly via link checker.

---

## 5. Traceability Model

### Reference format

Every significant claim uses one of:

```
[Code: src/path/File.ts:line-range]          — links to source
[Config: config.sample.yml#section]          — links to config
[Issue: #number]                              — links to GitHub issue
[Spec: MSC1234 or spec-section-url]          — links to Matrix spec
[External: service-name — doc-topic](url)    — links to upstream docs
[Assumption — needs verification]             — marks uncertainty
[Observed: description]                       — empirical finding
```

### Linking strategy

- Internal links: relative paths (`../understand/connections.md`)
- Code links: file path + line numbers (can be GitHub permalink in rendered docs)
- Spec links: always to `latest/` unless version-specific
- External links: to stable/permanent URLs, not blog posts

### Avoiding broken trust

- Never claim "hookshot does X" without code or behavioral evidence
- If code behavior is ambiguous, say so: "Based on `Bridge.ts:319`, hookshot appears to..."
- If a feature is partially implemented, state the limitation
- If external API behavior is assumed, link to their docs

---

## 6. Issue & Subtask Breakdown

### Issue 1: Create mental model pages (understand/)

**Goal:** Readers can explain hookshot's architecture after reading 4 pages.
**Outcome:** `understand/` section with: what-is-hookshot, event-lifecycle, integration-model, trust-and-boundaries, glossary.
**Why:** Current docs have zero conceptual foundation.

Subtasks:
- [ ] Write `understand/what-is-hookshot.md` — system context diagram, one-paragraph positioning. Source: `src/Bridge.ts` startup flow, `DOCUMENTATION_ARCHITECTURE.md` section 5.
- [ ] Write `understand/event-lifecycle.md` — inbound + outbound sequence diagrams. Source: `src/Bridge.ts:300-500` handler bindings, `src/Webhooks.ts` routing.
- [ ] Write `understand/integration-model.md` — the Connection abstraction. Source: `src/Connections/IConnection.ts:30-117`, `src/Connections/BaseConnection.ts`.
- [ ] Write `understand/trust-and-boundaries.md` — auth model overview. Source: GitHub OAuth in `src/github/GithubInstance.ts`, JIRA OAuth, appservice auth.
- [ ] Write `understand/glossary.md` — define: connection, state event, appservice, bridge, hook, transformation.

### Issue 2: Build the integration template and write GitHub page

**Goal:** One complete integration page that sets the quality bar.
**Outcome:** `integrations/github.md` following the template, with all evidence blocks filled.
**Why:** GitHub is the richest integration (6 connection types, 23 events, 4 bot commands, emoji reactions).

Subtasks:
- [ ] Finalize integration template (from DOCUMENTATION_ARCHITECTURE.md section 6)
- [ ] Write capabilities table — verified against `src/Connections/Github*.ts`
- [ ] Document all 23 event types with their Matrix message format. Source: `src/Connections/GithubRepo.ts:1114-1787`
- [ ] Document auth flows with sequence diagrams. Source: `src/github/GithubInstance.ts`, `src/github/AdminCommands.ts`
- [ ] Document bot commands. Source: `@botCommand` decorators in `GithubRepo.ts:922-1112`
- [ ] Document emoji reaction mappings (currently undocumented)
- [ ] Create example payloads (GitHub webhook → Matrix message)
- [ ] List limitations and link to relevant issues

### Issue 3: Create reference section (partially generated)

**Goal:** Lookup-optimized pages for config, commands, metrics, event types.
**Outcome:** `reference/` section with 5+ pages.
**Why:** No reference documentation currently exists.

Subtasks:
- [ ] Write script to extract `@botCommand` metadata → `reference/bot-commands.md`
- [ ] Write script to extract config schema from `src/config/Config.ts:123-251` → `reference/configuration.md`
- [ ] Catalog all `uk.half-shot.matrix-hookshot.*` state events → `reference/event-types.md`
- [ ] Document all Prometheus metrics from `src/Metrics.ts` → `reference/metrics.md`
- [ ] Document provisioning API endpoints from `src/widgets/BridgeWidgetApi.ts:28-122` → `reference/provisioning-api.md`
- [ ] Create `reference/matrix-spec-map.md` — map hookshot concepts to spec sections

### Issue 4: Restructure operator guides

**Goal:** Operators have a clear path from install to production.
**Outcome:** `guides/operator/` with installation, configuration, registration, monitoring, upgrading.
**Why:** Current setup/ section mixes operator and user concerns.

Subtasks:
- [ ] Migrate `docs/setup.md` → `guides/operator/installation.md` (operator parts only)
- [ ] Migrate `docs/setup/sample-configuration.md` → `guides/operator/configuration.md` (with walkthrough)
- [ ] Write `guides/operator/registration.md` — appservice registration for Synapse/Dendrite
- [ ] Migrate `docs/metrics.md` + `docs/sentry.md` → `guides/operator/monitoring.md`
- [ ] Migrate `docs/advanced/workers.md` → `guides/operator/workers-and-scaling.md`
- [ ] Migrate `docs/advanced/encryption.md` → `guides/operator/encryption.md`
- [ ] Write `guides/operator/upgrading.md` — version migration notes (currently missing)

### Issue 5: Create quickstart and tutorials

**Goal:** New users get a working setup in 5 minutes.
**Outcome:** `get-started/` section with quickstart + 2 tutorials.
**Why:** No quickstart exists. Current docs require reading 3+ pages before anything works.

Subtasks:
- [ ] Write `get-started/quickstart.md` — docker-compose, minimal config, one webhook
- [ ] Write `get-started/first-webhook.md` — end-to-end generic webhook tutorial
- [ ] Write `get-started/evaluate.md` — feature matrix, comparison, limitations

### Issue 6: Build troubleshooting section

**Goal:** Operators can diagnose common failures without asking for help.
**Outcome:** `troubleshooting/` with symptom-indexed pages.
**Why:** Current `troubleshooting.md` is a single page for all problems.

Subtasks:
- [ ] Write `troubleshooting/webhooks-not-arriving.md`
- [ ] Write `troubleshooting/authentication.md`
- [ ] Write `troubleshooting/connection-issues.md`
- [ ] Write `troubleshooting/common-errors.md` — extract from GitHub issues
- [ ] Write `troubleshooting/index.md` — symptom → page routing table

### Issue 7: Migrate remaining integration pages

**Goal:** All 8 integrations documented to template.
**Outcome:** `integrations/` complete for GitLab, JIRA, webhooks, feeds, Figma, OpenProject, ChallengeHound.

Subtasks (one per integration):
- [ ] `integrations/gitlab.md` — Source: `src/Connections/GitlabRepo.ts`, `src/Connections/GitlabIssue.ts`
- [ ] `integrations/jira.md` — Source: `src/Connections/JiraProject.ts`, `src/jira/`
- [ ] `integrations/generic-webhooks.md` — Source: `src/Connections/GenericHook.ts`, `src/Connections/OutboundHook.ts`
- [ ] `integrations/feeds.md` — Source: `src/Connections/FeedConnection.ts`, Rust feed parser
- [ ] `integrations/figma.md` — Source: `src/Connections/FigmaFileConnection.ts`
- [ ] `integrations/openproject.md` — Source: `src/Connections/OpenProjectConnection.ts`
- [ ] `integrations/challengehound.md` — Source: `src/Connections/HoundConnection.ts`
- [ ] `integrations/overview.md` — Capability matrix across all integrations

---

## 7. Page Construction Rules

Every page MUST include:

1. **Frontmatter** with title, description, audience, and relevant tags
2. **Opening sentence** that says what this page helps you do (not what it "covers")
3. **Core content** — no filler paragraphs. Every paragraph adds information.
4. **At least one evidence block** — code reference, example, or external link
5. **Related section** at the bottom — structured links to concept, guide, reference, troubleshooting pages
6. **Limitations/unknowns section** (where applicable) — what this page doesn't cover and why

Every page MUST NOT include:

- Paragraphs that restate the heading
- "In this section, we will..." preamble
- Undocumented claims about behavior
- Config examples without explaining what they do
- External links without context on why they're relevant

---

## 8. Integration Pages Assessment

The proposed template in DOCUMENTATION_ARCHITECTURE.md Section 6 is strong. Gaps:

### Missing from current template

- **Emoji reaction mappings** — GitHub (and possibly others) support reaction-to-action mappings. Not in template.
  - Fix: Add "Reactions" section between "Bot commands" and "Limitations"

- **Connection types enumeration** — GitHub has 6 connection types, not just "repository." Template assumes one connection per integration.
  - Fix: Add "Connection types" table at the top, before "Capabilities"

- **Message format examples** — Template says "[Example payload]" but doesn't specify: show the Matrix `m.room.message` event content including the custom `uk.half-shot.*` metadata fields.
  - Fix: Require full Matrix event JSON, not just the formatted body

- **Default vs. opt-in events** — Template lists events but doesn't distinguish defaults from opt-in.
  - Fix: Add "Default" column to events table (as done in Round 1 GitHub draft)

- **Static connection config** — Template covers bot commands and widget UI for connection creation, but not static YAML config or direct state event manipulation.
  - Fix: Add "Static connections" subsection under Setup

### What the template gets right

- Capabilities table with consistent columns
- Sequence diagram for primary flow
- Auth section with upstream links
- Troubleshooting scoped to this integration
- Upstream references table
- Related section at bottom

---

## 9. Readability Rules

- **Sentence length:** 25 words max guideline. If you need a comma, consider splitting.
- **Paragraph size:** 3-4 sentences max. One idea per paragraph.
- **Use bullets when:** listing 3+ items, enumerating steps, comparing options.
- **Use tables when:** showing structured data with 2+ dimensions (events, capabilities, config keys).
- **Use diagrams when:** showing flow (sequence), relationships (component), or state (lifecycle). Never for decoration.
- **Use code blocks when:** showing exact syntax, commands, payloads, or config. Always specify language.
- **Heading style:** Noun phrases ("Authentication") or imperatives ("Configure the GitHub App"). Never questions ("How do I configure?") in headings — questions belong in troubleshooting.
- **Active voice always.** "Hookshot validates the signature" not "The signature is validated."
- **No hedging.** "Hookshot sends a message" not "Hookshot will attempt to send a message." If behavior is conditional, state the condition.

---

## 10. "Proof Over Promise" Rules

### Assumptions presented as facts
- Before writing "hookshot does X": grep for it, read the code, confirm
- If unconfirmed: write "Based on `src/File.ts:line`, hookshot appears to X. [Needs verification]"
- Never claim support for something based on config key existence alone — config keys can be dead code

### Outdated claims
- Every page that references code includes file paths. When code changes, search finds affected pages.
- Pages with `last_verified` frontmatter field — stale after 6 months, flagged in CI
- Config examples tested against current schema in CI

### Undocumented features
- Before documenting a feature, verify it works (or mark as "not verified")
- Emoji reactions in GitHub integration: undocumented because no one checked the code. This is the default failure mode. The antidote: code-reading sessions that feed docs.

---

## 11. Example Rewrite

### Current: `docs/setup/github.md` (excerpt)

> You will need to create a GitHub App. You should give it:
>
> A unique name and homepage (this doesn't matter, it can be anything you like)
>
> Webhook URL should be the public address of the hookshot listener, with the path of /github/webhook.

### Rewritten

```markdown
## Create a GitHub App

Hookshot authenticates with GitHub as a [GitHub App](https://docs.github.com/en/apps).
You need one App per hookshot instance.

1. Go to your GitHub org → Settings → Developer settings → GitHub Apps → New GitHub App
2. Set:
   - **Name**: anything unique (e.g., `my-hookshot`)
   - **Homepage URL**: your hookshot URL (cosmetic only)
   - **Webhook URL**: `https://<hookshot-host>/github/webhook`
   - **Webhook secret**: generate one (`openssl rand -hex 32`)

3. Under Permissions, enable:

   | Category | Permission | Access |
   |---|---|---|
   | Repository | Actions | Read-only |
   | Repository | Contents | Read-only |
   | Repository | Discussions | Read & write |
   | Repository | Issues | Read & write |
   | Repository | Metadata | Read-only |
   | Repository | Projects | Read-only |
   | Repository | Pull requests | Read & write |
   | Organization | Team discussions | Read & write |

   [Code: permissions checked in src/github/GithubInstance.ts]
   [External: GitHub App permissions reference](https://docs.github.com/en/apps/creating-github-apps/setting-permissions-for-github-apps)

4. Subscribe to webhook events:

   commit_comment, create, delete, discussion, discussion_comment,
   issue_comment, issues, project, project_card, project_column,
   pull_request, pull_request_review, pull_request_review_comment,
   push, release, repository, workflow_run

   [Code: handled in src/github/Router.ts and src/Bridge.ts:300-500]

5. After creation, note the **App ID** and download the **private key** (.pem file).

6. Add to `config.yml`:

   ```yaml
   github:
     auth:
       id: 12345                    # App ID from step 5
       privateKeyFile: github.pem   # Path to private key from step 5
     webhook:
       secret: "your-secret"        # Secret from step 2
   ```

   [Config: src/config/sections/GitHub.ts:1-68]

**What happens next:** When hookshot starts, it authenticates as the GitHub App
and listens for webhooks at `/github/webhook`. Webhook payloads are verified
using the HMAC-SHA256 signature in the `x-hub-signature-256` header.
[Code: src/github/Router.ts:74-99]
```

---

## 12. Final Summary

**What makes this documentation trustworthy:**
- Every claim traces to code, spec, or external documentation
- Uncertainty is marked, not hidden
- Structure matches how people actually need information (by task and role, not by internal module)

**Why developers will actually read it:**
- Mental model pages mean they understand *why* before they see *how*
- Integration pages follow a predictable template — learn the format once, scan any service fast
- Reference pages are lookup-optimized — no reading required, just search
- Troubleshooting starts from symptoms, not from system internals

---

## Appendix: Template Improvements

### Additions to concept page template
- Add `## What this does NOT cover` section
- Add `## Prerequisites` (which concept pages should be read first)

### Additions to integration page template
- Add `## Connection types` table (before Capabilities)
- Add `## Reactions` section (after Bot commands)
- Add `## Static connections` subsection under Setup
- Require full Matrix event JSON in example payloads
- Add "Default" column to events table

### Additions to troubleshooting template
- Add `## Before you start` — basic diagnostic checklist (is hookshot running, can you see logs)
- Add `## Collect this information` — what to gather before filing a bug

### Additions to tutorial template
- Add `## If something went wrong` — common failure points for each step
- Add estimated time for each step, not just total
