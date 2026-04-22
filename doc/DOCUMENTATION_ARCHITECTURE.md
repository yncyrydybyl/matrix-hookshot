# Documentation Architecture for Matrix Hookshot

---

## 1. Core Documentation Philosophy

### The guiding philosophy

**Teach the machine, not the knobs.**

Hookshot is not a collection of integrations — it is a programmable event bridge with a coherent architecture. The documentation must reveal that architecture. Every integration page, every config reference, every tutorial should reinforce the reader's mental model of how the system works as a whole. A reader who understands the model can predict behavior they haven't seen documented. A reader who only knows config keys is helpless the moment something unexpected happens.

### What similar projects get wrong

| Anti-pattern | Why it fails | What we do instead |
|---|---|---|
| **Config-first structure** — docs open with YAML | Reader has no model to hang config on; every key feels arbitrary | Architecture first, config as evidence of the model |
| **Integration silos** — each service is its own world | Reader can't transfer knowledge between integrations; system feels incoherent | Shared integration model taught once, each service shown as an instance |
| **Flat reference dump** — one giant page per topic | No reading path, no narrative, search-hostile | Layered: concept → guide → reference, each page does one job |
| **Missing trust/failure model** — only happy paths | Operators can't reason about production behavior | Explicit sections for trust boundaries, failure modes, observability |
| **External links as afterthoughts** — scattered or absent | Reader can't verify claims or go deeper | Curated external reference blocks on every relevant page |
| **Single audience** — either too simple or too deep | Evaluators bounce, contributors starve | Persona-aware navigation with explicit reading paths |

### The three laws of this documentation

1. **Every page earns its existence** by serving exactly one purpose for an identifiable reader.
2. **The system is the protagonist.** Integrations are characters in its story, not separate stories.
3. **Evidence over assertion.** Every claim about behavior ships with a diagram, payload, or example.

---

## 2. Top-Level Documentation Architecture

```
hookshot-docs/
│
├── index.md                          ← Landing page with persona routing
│
├── understand/                       ← Mental model & architecture (read first)
│   ├── what-is-hookshot.md
│   ├── how-it-works.md
│   ├── system-components.md
│   ├── event-lifecycle.md
│   ├── integration-model.md
│   ├── trust-and-boundaries.md
│   └── glossary.md
│
├── get-started/                      ← Time-to-value fast paths
│   ├── quickstart.md
│   ├── first-webhook.md
│   ├── first-github-notification.md
│   └── evaluate.md
│
├── guides/                           ← Task-oriented how-tos
│   ├── user/                         ← For people using hookshot in rooms
│   │   ├── connecting-a-room.md
│   │   ├── bot-commands.md
│   │   ├── widgets.md
│   │   ├── notifications.md
│   │   └── transformation-functions.md
│   ├── operator/                     ← For people running hookshot
│   │   ├── installation.md
│   │   ├── configuration.md
│   │   ├── registration.md
│   │   ├── encryption.md
│   │   ├── service-bots.md
│   │   ├── workers-and-scaling.md
│   │   ├── monitoring.md
│   │   ├── upgrading.md
│   │   └── hardening.md
│   └── developer/                    ← For people building on hookshot
│       ├── provisioning-api.md
│       ├── webhook-api.md
│       ├── widget-integration.md
│       └── custom-transformations.md
│
├── integrations/                     ← Per-service pages (uniform template)
│   ├── overview.md                   ← Capability matrix + integration model recap
│   ├── github.md
│   ├── gitlab.md
│   ├── jira.md
│   ├── generic-webhooks.md
│   ├── feeds.md
│   ├── figma.md
│   ├── openproject.md
│   └── challengehound.md
│
├── architecture/                     ← Deep internals for contributors & architects
│   ├── overview.md
│   ├── component-model.md
│   ├── connections.md
│   ├── state-and-storage.md
│   ├── protocol-bridges.md
│   ├── authentication-flows.md
│   ├── message-pipeline.md
│   ├── rust-typescript-boundary.md
│   ├── extensibility.md
│   └── failure-and-recovery.md
│
├── reference/                        ← Lookup tables (generated where possible)
│   ├── configuration.md
│   ├── bot-commands.md
│   ├── provisioning-api.md
│   ├── metrics.md
│   ├── event-types.md
│   ├── permissions.md
│   ├── environment-variables.md
│   └── matrix-spec-map.md
│
├── troubleshooting/                  ← Problem-first navigation
│   ├── index.md
│   ├── connection-issues.md
│   ├── authentication.md
│   ├── webhooks-not-arriving.md
│   ├── encryption.md
│   ├── performance.md
│   └── common-errors.md
│
├── recipes/                          ← Copy-paste solutions
│   ├── github-pr-to-matrix.md
│   ├── gitlab-ci-notifications.md
│   ├── jira-ticket-tracking.md
│   ├── rss-news-feed.md
│   ├── custom-webhook-transform.md
│   └── multi-room-routing.md
│
├── external-references/              ← Curated upstream links
│   ├── matrix-spec.md
│   ├── github-api.md
│   ├── gitlab-api.md
│   ├── jira-api.md
│   └── webhook-standards.md
│
├── project/                          ← Meta: roadmap, compatibility, contributing
│   ├── roadmap.md
│   ├── compatibility.md
│   ├── changelog.md
│   ├── limitations.md
│   └── contributing.md
│
└── assets/
    ├── diagrams/
    ├── screenshots/
    ├── videos/
    └── payloads/
```

### Sidebar navigation grouping

```yaml
sidebar:
  - group: "Understand"
    icon: "lightbulb"
    items: [understand/*]
    collapsed: false

  - group: "Get Started"
    icon: "rocket"
    items: [get-started/*]

  - group: "Guides"
    icon: "book"
    items:
      - group: "For Users"
        items: [guides/user/*]
      - group: "For Operators"
        items: [guides/operator/*]
      - group: "For Developers"
        items: [guides/developer/*]

  - group: "Integrations"
    icon: "plug"
    items: [integrations/*]

  - group: "Architecture"
    icon: "building"
    items: [architecture/*]

  - group: "Recipes"
    icon: "flask"
    items: [recipes/*]

  - group: "Reference"
    icon: "clipboard"
    items: [reference/*]

  - group: "Troubleshooting"
    icon: "wrench"
    items: [troubleshooting/*]

  - group: "External References"
    icon: "link"
    items: [external-references/*]

  - group: "Project"
    icon: "pin"
    items: [project/*]
```

---

## 3. Section-by-Section Purpose

### `understand/` — Mental Model

| | |
|---|---|
| **For** | Every reader, especially first-time visitors |
| **Problem it solves** | "I don't know what this system is or how to think about it" |
| **Content** | Concepts, diagrams, the integration model, event lifecycle, trust boundaries, glossary |
| **NOT here** | Config examples, setup steps, API references, troubleshooting |

This section exists so that by the time a reader reaches any other section, they have a mental model that makes everything else predictable. The `event-lifecycle.md` page is the single most important page in the entire documentation — it shows how an event enters the system, gets routed, transformed, and delivered. The `integration-model.md` page teaches the abstraction that all integrations share (connection, event source, event sink, auth context, state) so that individual integration pages feel like instances, not islands.

### `get-started/` — Time to Value

| | |
|---|---|
| **For** | Evaluators, new admins, anyone impatient |
| **Problem it solves** | "Can I get this running and see it work in under 10 minutes?" |
| **Content** | Docker-compose quickstart, first webhook tutorial, first GitHub notification, evaluation checklist |
| **NOT here** | Production deployment, full config reference, architecture |

Every page in this section ends with a working result the reader can see. No page exceeds 5 minutes of effort. Each page links forward to the relevant deeper guide.

### `guides/` — Task-Oriented How-Tos

Three sub-audiences, strictly separated:

**`guides/user/`** — For room moderators and team leads

| | |
|---|---|
| **Problem it solves** | "How do I use hookshot features in my Matrix room?" |
| **Content** | Connecting rooms, bot commands, widgets, notifications, writing transformation functions |
| **NOT here** | Server configuration, deployment, API usage |

**`guides/operator/`** — For admins running hookshot

| | |
|---|---|
| **Problem it solves** | "How do I deploy, configure, secure, scale, and maintain hookshot?" |
| **Content** | Installation, configuration walkthrough, appservice registration, encryption, monitoring, upgrades, hardening |
| **NOT here** | End-user features, API development, architecture internals |

**`guides/developer/`** — For platform developers building on hookshot

| | |
|---|---|
| **Problem it solves** | "How do I integrate my system with hookshot's APIs?" |
| **Content** | Provisioning API usage, webhook API, widget embedding, custom transformations |
| **NOT here** | Internal architecture, deployment, end-user usage |

### `integrations/` — Per-Service Pages

| | |
|---|---|
| **For** | All audiences; the integration-specific entry point |
| **Problem it solves** | "What does hookshot do with [GitHub/GitLab/JIRA/...]?" |
| **Content** | Capabilities, architecture fit, auth model, event mapping, setup, examples, limitations, upstream links |
| **NOT here** | General hookshot concepts (link to `understand/`), detailed config reference (link to `reference/`) |

`overview.md` opens with a capability matrix — a table showing every integration x every capability (receive events, send commands, bidirectional sync, webhooks, OAuth, etc.). This single page answers the evaluator's #1 question.

Every integration page follows the same template (Section 6). This consistency is a feature: readers learn the template once and can scan any integration fast.

### `architecture/` — Deep Internals

| | |
|---|---|
| **For** | Contributors, enterprise architects, curious operators |
| **Problem it solves** | "How does hookshot actually work inside?" |
| **Content** | Component model, connection abstraction, state management, protocol bridging, auth flows, message pipeline, Rust/TS boundary, extensibility, failure modes |
| **NOT here** | Setup instructions, user-facing features, config reference |

This is the section that makes architects say "these people know what they're doing." It reveals the system's elegance. See Section 5 for detailed structure.

### `reference/` — Lookup Tables

| | |
|---|---|
| **For** | Anyone who already knows what they're looking for |
| **Problem it solves** | "What are the exact parameters / metrics / commands / event types?" |
| **Content** | Complete config schema, every bot command, API endpoints, Prometheus metrics, permission model, environment variables, Matrix spec mapping |
| **NOT here** | Explanations, tutorials, opinions |

Pages here are exhaustive, tabular, and partially generated. `matrix-spec-map.md` maps every hookshot concept to the relevant Matrix spec section — this is unique and powerful.

### `troubleshooting/` — Problem-First

| | |
|---|---|
| **For** | Anyone with a broken setup |
| **Problem it solves** | "Something isn't working and I need to fix it now" |
| **Content** | Symptom-indexed pages, diagnostic steps, common errors with explanations, log reading guides |
| **NOT here** | General setup (link back to guides), feature documentation |

Every page opens with the symptom ("Webhooks arrive but no message appears in the room") and walks backward to causes.

### `recipes/` — Copy-Paste Solutions

| | |
|---|---|
| **For** | Anyone who wants a complete working example |
| **Problem it solves** | "Show me exactly how to do [specific thing]" |
| **Content** | End-to-end walkthroughs with full config, commands, and expected output |
| **NOT here** | Concepts, partial examples, reference data |

Each recipe is self-contained. A reader should be able to follow it without reading anything else (though links to concept pages are provided for context).

### `external-references/` — Curated Upstream Links

| | |
|---|---|
| **For** | Anyone who needs to understand the systems hookshot connects to |
| **Problem it solves** | "Where do I find the GitHub/Matrix/JIRA docs relevant to what hookshot does?" |
| **Content** | Curated, annotated link collections grouped by topic (auth, webhooks, events, rate limits, APIs) |
| **NOT here** | Hookshot-specific documentation |

This is not a link dump. Each page is organized by topic with a one-sentence annotation explaining why each link matters and what hookshot feature it relates to.

### `project/` — Meta

| | |
|---|---|
| **For** | Contributors, evaluators, enterprise decision-makers |
| **Problem it solves** | "Where is this project going? What are its limits? How do I contribute?" |
| **Content** | Roadmap, compatibility matrix, changelog, known limitations, contribution guide |
| **NOT here** | Technical docs, setup, usage |

---

## 4. Recommended Reading Paths by Persona

### Evaluator — "Should we use this?"
```
index.md
  -> understand/what-is-hookshot.md
  -> understand/how-it-works.md
  -> integrations/overview.md          (capability matrix)
  -> get-started/evaluate.md
  -> get-started/quickstart.md         (try it)
  -> project/compatibility.md
  -> project/limitations.md
```

### Developer — "I need to integrate with this"
```
index.md
  -> understand/what-is-hookshot.md
  -> understand/integration-model.md
  -> understand/event-lifecycle.md
  -> guides/developer/provisioning-api.md
  -> guides/developer/webhook-api.md
  -> integrations/{relevant-service}.md
  -> reference/provisioning-api.md
  -> recipes/{relevant-recipe}.md
```

### Operator — "I need to run this in production"
```
index.md
  -> understand/what-is-hookshot.md
  -> understand/system-components.md
  -> get-started/quickstart.md
  -> guides/operator/installation.md
  -> guides/operator/configuration.md
  -> guides/operator/registration.md
  -> integrations/{each-needed-service}.md  (setup sections)
  -> guides/operator/monitoring.md
  -> guides/operator/hardening.md
  -> reference/configuration.md
  -> reference/metrics.md
  -> troubleshooting/
```

### Contributor — "I want to work on the code"
```
index.md
  -> understand/how-it-works.md
  -> understand/system-components.md
  -> understand/event-lifecycle.md
  -> architecture/overview.md
  -> architecture/component-model.md
  -> architecture/connections.md
  -> architecture/rust-typescript-boundary.md
  -> architecture/extensibility.md
  -> project/contributing.md
```

### Enterprise Architect — "Does this fit our system?"
```
index.md
  -> understand/what-is-hookshot.md
  -> understand/trust-and-boundaries.md
  -> architecture/overview.md
  -> architecture/authentication-flows.md
  -> architecture/failure-and-recovery.md
  -> integrations/overview.md
  -> guides/operator/workers-and-scaling.md
  -> guides/operator/hardening.md
  -> project/compatibility.md
  -> project/limitations.md
  -> reference/matrix-spec-map.md
```

---

## 5. Internals and Architecture Section Design

```
architecture/
├── overview.md                 ← System diagram, component inventory, 10,000ft view
├── component-model.md          ← Every runtime component, its role, its boundaries
├── connections.md              ← The Connection abstraction: lifecycle, state, types
├── state-and-storage.md        ← Matrix state as primary store, Redis, caching
├── protocol-bridges.md         ← How Matrix protocol maps to external protocols
├── authentication-flows.md     ← OAuth flows, token lifecycle, trust delegation
├── message-pipeline.md         ← Inbound and outbound message processing
├── rust-typescript-boundary.md ← NAPI boundary, what lives where, why
├── extensibility.md            ← How to add a new integration type
└── failure-and-recovery.md     ← Failure modes, retry behavior, degradation
```

### Page-by-page design

**`overview.md`** — The anchor page

Opens with a full system diagram showing hookshot's position between Matrix homeserver and external services. Includes:
- Component inventory table (name, responsibility, runtime location)
- Data flow summary: inbound events -> hookshot -> Matrix rooms (and reverse)
- Trust boundary diagram: what trusts what, where credentials live
- Link to every sub-page

```
[Diagram: System context — hookshot between Matrix HS and external services]
[Diagram: Component inventory — all runtime components and their relationships]
```

**`component-model.md`** — Runtime anatomy

- The Bridge (entry point, Matrix event dispatch)
- ConnectionManager (connection lifecycle, state derivation)
- Connections (the abstraction, types, state machines)
- Listeners (HTTP server for webhooks)
- MessageQueue (internal async delivery)
- StorageProviders (Redis, memory)
- MatrixSender (outbound Matrix messages)
- BotCommands (command parsing and dispatch)
- Widgets (frontend provisioning UI)
- Rust modules (performance-critical operations via NAPI)

Each component: what it does, what it owns, what it depends on, what calls it.

```
[Diagram: Component dependency graph]
[Diagram: Runtime process model — what runs in what thread/worker]
```

**`connections.md`** — The core abstraction

This is the most important architecture page. Connections are hookshot's central idea.

- What a Connection is (a bidirectional binding between a Matrix room and an external resource)
- Connection lifecycle: creation -> configuration -> active -> updated -> removed
- Connection state: stored as Matrix room state events
- Connection types: the type hierarchy, shared interface, per-service specialization
- How connections handle inbound events (external -> Matrix)
- How connections handle outbound commands (Matrix -> external)
- Connection provisioning: via bot commands, widgets, static config, API

```
[Diagram: Connection lifecycle state machine]
[Diagram: Connection type hierarchy]
[Sequence diagram: Inbound event through a connection]
[Sequence diagram: Outbound command through a connection]
```

**`state-and-storage.md`**

- Matrix room state as primary data store
- What state events hookshot reads and writes
- Redis as secondary store (feeds, caches, queues)
- Memory-only storage for development
- Startup: deriving connection state from room state
- Consistency model: what happens during netsplits, restarts

```
[Diagram: State derivation on startup]
[Table: State event types and their schemas]
```

**`protocol-bridges.md`**

- How Matrix event types map to external event types
- Bidirectional mapping tables per integration
- Message format translation (Markdown, HTML, Matrix formatted body)
- Attachment and media handling
- Rate limiting and backpressure across protocol boundaries

```
[Table: Matrix event <-> GitHub event mapping]
[Table: Matrix event <-> GitLab event mapping]
[Table: Matrix event <-> JIRA event mapping]
```

**`authentication-flows.md`**

- Appservice authentication (Matrix side)
- Per-service auth models (OAuth 2.0, OAuth 1.0, tokens, API keys)
- Token storage and encryption
- Token refresh lifecycle
- User-level vs. instance-level credentials
- Trust delegation: when hookshot acts as a user vs. as a service

```
[Sequence diagram: GitHub App OAuth flow]
[Sequence diagram: JIRA Cloud OAuth 2.0 flow]
[Sequence diagram: GitLab token authentication]
[Diagram: Trust delegation model]
```

**`message-pipeline.md`**

- Inbound pipeline: HTTP webhook -> validation -> routing -> connection -> transformation -> Matrix send
- Outbound pipeline: Matrix event -> command parse -> connection -> external API call
- Transformation functions: the QuickJS sandbox, v1 vs v2 API, execution model
- Message queue: async delivery, ordering, retry
- Error handling at each pipeline stage

```
[Sequence diagram: Full inbound webhook pipeline]
[Sequence diagram: Full outbound command pipeline]
[Diagram: Transformation function sandbox model]
```

**`rust-typescript-boundary.md`**

- What lives in Rust vs. TypeScript and why
- The NAPI-rs interface
- Data serialization across the boundary
- Build process: how Rust compiles into the Node.js module
- Performance characteristics
- Adding new Rust modules

```
[Diagram: Rust/TypeScript module boundary]
[Table: Current Rust modules and their purposes]
```

**`extensibility.md`**

- How to add a new Connection type
- The connection interface contract
- Registering event handlers
- Adding bot commands for a new service
- Adding provisioning API endpoints
- Adding widget UI for a new integration
- Testing a new integration

```
[Code example: Minimal connection implementation skeleton]
[Code example: Registering a new connection type]
```

**`failure-and-recovery.md`**

- What happens when an external service is down
- What happens when the Matrix homeserver is unreachable
- Retry behavior and backoff
- Message queue behavior during failures
- State recovery on restart
- Webhook delivery guarantees (at-least-once, ordering)
- Feed polling failure and recovery
- Monitoring failure: which metrics to alert on

```
[Table: Failure scenario x system behavior x recovery action]
[Diagram: Retry and backoff model]
```

---

## 6. Integration Documentation Model

Every integration page follows this template. Consistency is non-negotiable.

```markdown
---
title: "{Service Name} Integration"
description: "Connect Matrix rooms to {Service Name} for {value prop}"
audience: [user, operator, developer]
integration: {service-slug}
capabilities: [receive-events, send-commands, bidirectional, oauth, webhooks]
status: stable | beta | deprecated
---

# {Service Name}

> One-paragraph summary: what this integration does and why you'd use it.

[Screenshot: Example Matrix message from this integration]

## Capabilities

| Capability | Supported | Notes |
|---|---|---|
| Receive events in Matrix | Y / N | |
| Send commands from Matrix | Y / N | |
| Bidirectional sync | Y / N | |
| OAuth authentication | Y / N | |
| Webhook-based | Y / N | |
| Bot commands | Y / N | |
| Widget UI | Y / N | |
| Encryption compatible | Y / N | |

## How it works

Brief explanation in terms of the integration model.

[Sequence diagram: Primary event flow]

See [Integration Model](../understand/integration-model.md) for general context.

## Supported events

| External event | Matrix result | Direction |
|---|---|---|
| {event} | {result} | Inbound / Outbound |

## Authentication

How auth works for this integration.

[Sequence diagram: Auth flow]

External references:
- [{Service} auth documentation]({url})
- [{Service} permissions/scopes reference]({url})

## Setup

### Operator: Server-side configuration

Step-by-step operator setup.

[Code example: config.yml section]

### User: Room-side connection

How to connect a room.

[Code example: Bot command]
[Screenshot: Widget UI]

## Example flows

### {Flow 1 name}

[Example payload: Incoming webhook payload]
[Example payload: Resulting Matrix message]

### {Flow 2 name}

[Example payload: Matrix command]
[Example payload: Resulting external API call]

## Bot commands

| Command | Description | Example |
|---|---|---|
| `!{prefix} {command}` | {description} | `{example}` |

## Limitations

- {Limitation 1}
- {Limitation 2}

## Troubleshooting

| Symptom | Likely cause | See |
|---|---|---|
| {symptom} | {cause} | [{page}]({path}) |

## Upstream references

| Topic | Link |
|---|---|
| API documentation | [{Service} API docs]({url}) |
| Webhook events | [{Service} webhook reference]({url}) |
| Authentication | [{Service} auth guide]({url}) |
| Rate limits | [{Service} rate limit docs]({url}) |

## Related

- [Integration Model](../understand/integration-model.md)
- [Event Lifecycle](../understand/event-lifecycle.md)
- [Config Reference]({config-section-link})
- [Matrix Spec: Application Service API](https://spec.matrix.org/latest/application-service-api/)
```

---

## 7. Reference and Evidence Placeholders

### Placeholder conventions for authors

Use HTML comments in the source to mark where rich assets belong:

```
<!-- ASSET: diagram — {filename} — {description} -->
<!-- ASSET: screenshot — {filename} — {description} -->
<!-- ASSET: sequence — {filename} — {description (Mermaid)} -->
<!-- ASSET: video — {filename} — {description} -->
<!-- ASSET: payload — {filename} — {description} -->
<!-- ASSET: api-call — {filename} — {description} -->
<!-- ASSET: matrix-event — {filename} — {description} -->
<!-- ASSET: spec-link — {URL or MSC number} -->
<!-- ASSET: external-link — {service} {doc-type} {URL} -->
```

### Asset filename conventions

```
assets/
├── diagrams/
│   ├── understand-system-context.svg
│   ├── understand-event-lifecycle.mmd
│   ├── architecture-component-model.svg
│   ├── architecture-connection-lifecycle.mmd
│   ├── integration-github-auth-flow.mmd
│   └── ...
├── screenshots/
│   ├── get-started-quickstart-result.png
│   ├── integration-github-room-message.png
│   ├── guides-user-widget-ui.png
│   └── ...
├── videos/
│   ├── get-started-quickstart.mp4
│   └── ...
└── payloads/
    ├── github-pull-request-opened.json
    ├── github-matrix-message-result.json
    ├── gitlab-merge-request-webhook.json
    └── ...
```

Pattern: `{section}-{slug}[-{qualifier}].{ext}`

### Evidence density targets

| Page type | Min diagrams | Min examples | Min screenshots |
|---|---|---|---|
| Concept page | 1 | 0 | 0 |
| Integration overview | 1 | 2 | 1 |
| Integration setup | 0 | 1 config snippet | 2 |
| Tutorial | 1 sequence | 3 | 3 |
| Architecture page | 2 | 1 | 0 |
| Reference page | 0 | 1 per entry | 0 |
| Recipe | 1 | 2 | 1 |
| Troubleshooting | 0 | 1 per symptom | 0 |

---

## 8. Navigation and Cross-Linking Model

### Page-level metadata

Every page carries frontmatter metadata for filtering, navigation, and future tooling:

```yaml
---
title: "Page Title"
description: "One-line description"
audience: [evaluator, user, operator, developer, contributor, architect]
integration: github          # Optional
component: connections       # Optional
feature: webhooks           # Optional
status: stable | beta | deprecated  # Optional
prereqs: [path/to/page.md] # Optional, for tutorials
time: "5 minutes"           # Optional, for tutorials
generated: false            # Optional
schema_source: "src/..."    # Optional, for generated content
symptoms: ["error text"]    # Optional, for troubleshooting
---
```

### Structured cross-reference blocks

Every page ends with a structured "Related" section:

```markdown
## Related

**Concepts**: [Connections](../understand/...) · [Event Lifecycle](../understand/...)
**Guides**: [Configuration](../guides/operator/...)
**Reference**: [Config](../reference/...) · [Bot Commands](../reference/...)
**Troubleshooting**: [Webhooks Not Arriving](../troubleshooting/...)
**Matrix Spec**: [Application Service API](https://spec.matrix.org/...)
**External**: [GitHub Webhooks](https://docs.github.com/...)
```

### Inline cross-linking rules

| When you mention... | Link to... |
|---|---|
| A hookshot concept | The relevant `understand/` page |
| A config key | `reference/configuration.md#{anchor}` |
| A bot command | `reference/bot-commands.md#{anchor}` |
| A Matrix concept | The relevant Matrix spec section |
| An external service concept | The relevant `external-references/` page |
| A failure mode or error | The relevant `troubleshooting/` page |
| An integration by name | `integrations/{service}.md` |

### Contextual banners

Pages primarily for one audience that are occasionally visited by another should include a contextual banner directing them to the right place.

---

## 9. Style and Editorial Rules

### Tone
- **Direct and confident.** Not "Hookshot can be used to..." but "Hookshot connects Matrix rooms to GitHub repositories."
- **Technical without ceremony.** Assume the reader is competent.
- **Precise.** "Hookshot sends an `m.room.message` event with `msgtype: m.notice`" — not "Hookshot sends a message."
- **Active voice.** "Hookshot validates the webhook signature" not "The webhook signature is validated by hookshot."

### Headings
- H1: Page title only (one per page)
- H2: Major sections
- H3: Subsections
- Never skip levels
- Headings are noun phrases or imperative verbs: "Authentication", "Configure the GitHub App"

### Diagrams
- Mermaid for sequence diagrams and flowcharts (version-controlled, editable)
- SVG for complex system diagrams
- Every diagram has a caption
- Color palette: blue for Matrix, green for hookshot, orange for external services, gray for infrastructure
- No decorative diagrams — every diagram teaches something

### Callouts

```
:::info          — Supplementary context
:::tip           — Recommendations and best practices
:::warning       — "This might bite you"
:::danger        — "Data loss or security risk if you ignore this"
:::note[...]     — Links to relevant specs or external docs
```

### Code examples
- Always specify language for syntax highlighting
- Use realistic values, not `foo`/`bar`
- Config examples: show only the relevant section, link to full sample
- CLI examples: show command AND expected output
- Mark optional fields with comments

### External systems
- Never document how an external system works — link to their docs
- Do document how hookshot interacts with that system
- Cite specific external doc pages

### Spec compliance
- Be explicit: "Hookshot implements MSC1234" or "This follows the Application Service API"
- If hookshot deviates or uses unstable features, say so clearly

### Limitations
- Never hide limitations
- Pattern: "Hookshot does not currently support X. See #123 for tracking."
- Group at the end of relevant pages

---

## 10. Showcase Pages — The "Hero Pages"

The 10 most important pages that create the wow effect:

### 1. `understand/event-lifecycle.md`
The page that makes the entire system click. Full sequence diagram showing an event from external service through hookshot to Matrix room and back.

### 2. `integrations/overview.md`
Single capability matrix answering "what can hookshot do?" for every integration. What evaluators screenshot for their team.

### 3. `understand/what-is-hookshot.md`
First impression. System scope, elegance, value in under 2 minutes of reading. System context diagram.

### 4. `architecture/overview.md`
The page that makes architects trust the project. Full component diagram, trust boundaries, design decisions.

### 5. `architecture/connections.md`
The abstraction that makes hookshot coherent. Makes the Connection model feel inevitable.

### 6. `get-started/quickstart.md`
Docker-compose up, send a webhook, see it in Matrix. Under 5 minutes. Trust through experience.

### 7. `architecture/authentication-flows.md`
Auth is where integration systems feel solid or terrifying. Full sequence diagrams, explicit trust boundaries.

### 8. `architecture/failure-and-recovery.md`
"We've thought about what happens when things break." Failure scenario table with behavior and recovery.

### 9. `reference/matrix-spec-map.md`
Unique page mapping every hookshot concept to Matrix spec sections. Signals deep protocol understanding.

### 10. `integrations/github.md`
The richest integration, written to the full template. Sets the standard for all others.

---

## 11. Example Skeletons

### Landing page (`index.md`)

```markdown
---
title: Matrix Hookshot Documentation
description: Connect Matrix to the tools your team uses
---

# Matrix Hookshot

Hookshot is a Matrix application service that connects your Matrix rooms to
external services — GitHub, GitLab, JIRA, RSS feeds, webhooks, and more.

It receives events from external services and delivers them as Matrix messages.
It accepts commands from Matrix rooms and executes them on external services.
It is a programmable, extensible bridge between Matrix and everything else.

<!-- DIAGRAM: System context -->

## Choose your path

| I want to... | Start here |
|---|---|
| Understand what hookshot does | What is Hookshot? |
| Try it in 5 minutes | Quickstart |
| Evaluate it for my organization | Evaluation Guide |
| Set up a production deployment | Installation Guide |
| Use hookshot in my Matrix rooms | User Guide |
| Build on hookshot's APIs | Developer Guide |
| Contribute to hookshot | Architecture Overview |
| See what integrations are available | Integration Overview |
```

### Architecture overview skeleton

```markdown
---
title: Architecture Overview
description: How hookshot works internally
audience: [contributor, architect]
---

# Architecture Overview

Hookshot is a Node.js application service that registers with a Matrix homeserver
via the Application Service API.

## System context

<!-- DIAGRAM: Full system context diagram -->

## Component model

<!-- DIAGRAM: Component dependency graph -->

| Component | Responsibility | Key files |
|---|---|---|
| Bridge | Matrix event dispatch | src/Bridge.ts |
| ConnectionManager | Connection lifecycle | src/ConnectionManager.ts |
| ... | ... | ... |

## Data flow

### Inbound: External -> Matrix

<!-- SEQUENCE_DIAGRAM: Inbound event flow -->

### Outbound: Matrix -> External

<!-- SEQUENCE_DIAGRAM: Outbound command flow -->

## Key design decisions

| Decision | Rationale |
|---|---|
| Matrix room state as primary storage | No external DB; state follows rooms |
| One Connection class per integration | Isolated failure, independent development |
| Rust for perf-critical paths | Feed parsing, crypto benefit from native speed |
| QuickJS sandbox for transformations | Safe user code execution |
```

### Troubleshooting page skeleton

```markdown
---
title: "Troubleshooting: Webhooks Not Arriving"
description: Diagnose why external webhooks aren't producing Matrix messages
audience: [operator, user]
symptoms: ["no messages", "webhook 200 but nothing happens", "webhook 404"]
---

# Webhooks not arriving

Checks ordered from most common to least common cause.

## Check 1: Is the webhook URL correct?

curl -v test and interpret the response:

| Response | Meaning | Action |
|---|---|---|
| 200 ok | Hookshot received it | Continue to Check 2 |
| 404 | URL doesn't match | Verify URL; recreate connection |
| 401 | Secret mismatch | Check webhook secret config |
| Connection refused | Hookshot not listening | Check process, port, firewall |

## Check 2: Is the connection active?

## Check 3: Is hookshot connected to the homeserver?

## Check 4: Is the message being transformed away?

## Check 5: Check hookshot metrics

## Still stuck?
```

---

## 12. Final Recommendation

**Build the `understand/` section first.** Everything else is a leaf on that tree.

The three highest-ROI pages to write first:

1. **`understand/event-lifecycle.md`** — the single diagram that makes the system click
2. **`integrations/overview.md`** — the capability matrix that sells the project
3. **`architecture/connections.md`** — the abstraction that makes it coherent

Then build outward: one integration page (GitHub) as reference implementation, one tutorial (first-webhook) as proof of simplicity, and the troubleshooting index as safety net.

Do not write all pages at once. Ship the skeleton with navigation, write the hero pages, fill the rest iteratively. A well-structured doc site with 15 excellent pages beats a complete site with 40 mediocre ones.

---

## Appendix: Authoring Templates

### A1. Concept Page Template

```markdown
---
title: "{Concept Name}"
description: "{One-line description}"
audience: [evaluator, developer, operator, contributor, architect]
---

# {Concept Name}

<!-- 2-3 sentence introduction -->

## Overview

<!-- High-level explanation -->
<!-- DIAGRAM: {Concept} in context -->

## How it works

### {Sub-concept 1}

<!-- Explanation -->
<!-- CODE_EXAMPLE -->

### {Sub-concept 2}

<!-- Explanation -->
<!-- SEQUENCE_DIAGRAM -->

## Key properties

- {Property 1}
- {Property 2}

## Examples

<!-- PAYLOAD or MATRIX_EVENT examples -->

## Common misconceptions

<!-- Optional -->

## Related

- Concepts: ...
- Guides: ...
- Reference: ...
- Matrix Spec: ...
```

### A2. Integration Page Template

(See Section 6 for the full template)

### A3. Tutorial Page Template

```markdown
---
title: "Tutorial: {Task Name}"
description: "{What the reader will accomplish}"
audience: [evaluator, user, operator, developer]
prereqs: [{list}]
time: "{N} minutes"
---

# {Task Name}

<!-- What you'll do and learn -->

**Prerequisites**: {list with links}
**Time**: ~{N} minutes

## What you'll build

<!-- DIAGRAM: End-state or flow -->

## Step 1: {Action verb + object}

<!-- Instructions, CODE_EXAMPLE, SCREENSHOT -->

## Step 2: {Action verb + object}

## Step N: {Final step}

<!-- SCREENSHOT: Final result -->

## What just happened

1. {Explanation linking to concepts}
2. ...

## Next steps

- [{Next tutorial}]({path})
- [{Concept page}]({path})
- [{Reference page}]({path})
```

### A4. Reference Page Template

```markdown
---
title: "{Subject} Reference"
description: "Complete reference for {subject}"
audience: [operator, developer, contributor]
generated: true | false
---

# {Subject} Reference

<!-- One sentence: what this covers -->

## {Category 1}

| {Col 1} | {Col 2} | {Col 3} | {Col 4} |
|---|---|---|---|

### {Entry name}

**Type**: `{type}`
**Default**: `{default}`
**Required**: yes / no
**Since**: v{version}

<!-- CODE_EXAMPLE: Usage example -->

## Related

- [{Concept page}]({path})
- [{Guide}]({path})
```

### A5. Troubleshooting Page Template

```markdown
---
title: "Troubleshooting: {Problem Area}"
description: "Diagnose and fix {problem area} issues"
audience: [operator, user]
symptoms: ["{symptom 1}", "{symptom 2}"]
---

# {Problem Area}

Work through these checks in order.

## Check 1: {Most common cause}

<!-- Diagnostic command -->

| Result | Meaning | Action |
|---|---|---|

## Check 2: {Next most common}

## Error messages

| Error | Cause | Fix |
|---|---|---|

## Still stuck?

- [Common errors](common-errors.md)
- [GitHub issues]({url})
- [Support channel]({url})
```

---

## Appendix: Metadata Model

```yaml
---
title: "Page Title"                    # Required
description: "One-line description"    # Required
audience:                              # Required
  - evaluator | user | operator | developer | contributor | architect
integration: github                    # Optional
component: connections                 # Optional
feature: webhooks                      # Optional
status: stable | beta | deprecated     # Optional
prereqs: [path/to/page.md]            # Optional
time: "5 minutes"                      # Optional
generated: false                       # Optional
schema_source: "src/config/schema.ts"  # Optional
symptoms: ["error text"]               # Optional
---
```

### Naming conventions

| Type | Pattern | Example |
|---|---|---|
| Concept pages | `{noun-phrase}.md` | `event-lifecycle.md` |
| Guide pages | `{verb-or-noun-phrase}.md` | `installation.md` |
| Integration pages | `{service-name}.md` | `github.md` |
| Tutorial pages | `{task-slug}.md` | `first-webhook.md` |
| Reference pages | `{subject}.md` | `configuration.md` |
| Troubleshooting | `{problem-slug}.md` | `webhooks-not-arriving.md` |
| Recipe pages | `{outcome-slug}.md` | `github-pr-to-matrix.md` |

Rules:
- Lowercase, hyphen-separated
- No abbreviations unless universally understood (api, oauth)
- No version numbers in filenames
- Directories are plural nouns: `guides/`, `integrations/`, `recipes/`
