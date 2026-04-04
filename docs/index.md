---
title: Matrix Hookshot
---

# Matrix Hookshot

Connect Matrix rooms to the tools your team uses — GitHub, GitLab, JIRA, webhooks, RSS feeds, Figma, OpenProject. One bridge for everything.

<div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin: 1.5rem 0;">
  <a href="/get-started/quickstart" style="padding: 0.6rem 1.2rem; background: var(--vp-c-brand-1); color: var(--vp-c-bg); border-radius: 8px; text-decoration: none; font-weight: 600;">Quickstart (5 min)</a>
  <a href="/understand/what-is-hookshot" style="padding: 0.6rem 1.2rem; border: 1px solid var(--vp-c-border); border-radius: 8px; text-decoration: none;">What is Hookshot?</a>
  <a href="/integrations/overview" style="padding: 0.6rem 1.2rem; border: 1px solid var(--vp-c-border); border-radius: 8px; text-decoration: none;">All Integrations</a>
</div>

## Documentation

| Section | Pages | Description |
|---|---|---|
| [**Get Started**](/get-started/quickstart) | [Quickstart](/get-started/quickstart) · [Evaluate](/get-started/evaluate) · [First Webhook](/get-started/first-webhook) · [First GitHub](/get-started/first-github-notification) | Try hookshot in 5 minutes |
| [**Understand**](/understand/what-is-hookshot) | [What is Hookshot](/understand/what-is-hookshot) · [Event Lifecycle](/understand/event-lifecycle) · [Integration Model](/understand/integration-model) · [Trust & Boundaries](/understand/trust-and-boundaries) · [Glossary](/understand/glossary) | Mental model — read first |
| [**Integrations**](/integrations/overview) | [Overview](/integrations/overview) · [GitHub](/integrations/github) · [GitLab](/integrations/gitlab) · [JIRA](/integrations/jira) · [Webhooks](/integrations/generic-webhooks) · [Feeds](/integrations/feeds) · [Figma](/integrations/figma) · [OpenProject](/integrations/openproject) | Per-service guides |
| [**Operator Guides**](/guides/operator/installation) | [Install](/guides/operator/installation) · [Config](/guides/operator/configuration) · [Monitoring](/guides/operator/monitoring) · [Encryption](/guides/operator/encryption) · [Workers](/guides/operator/workers-and-scaling) · [Hardening](/guides/operator/hardening) | Deploy and maintain |
| [**Architecture**](/architecture/connections) | [Connections](/architecture/connections) · [State & Storage](/architecture/state-and-storage) · [Components](/architecture/component-model) · [Extensibility](/architecture/extensibility) · [Failure](/architecture/failure-and-recovery) | How it works inside |
| [**Reference**](/reference/bot-commands) | [Bot Commands](/reference/bot-commands) · [Event Types](/reference/event-types) · [Provisioning API](/reference/provisioning-api) · [Metrics](/reference/metrics) · [Matrix Spec Map](/reference/matrix-spec-map) | Lookup tables |
| [**Troubleshooting**](/troubleshooting/) | [Webhooks](/troubleshooting/webhooks-not-arriving) · [Auth](/troubleshooting/authentication) · [Connections](/troubleshooting/connection-issues) · [Common Errors](/troubleshooting/common-errors) | Fix problems |
| [**Project**](/project/ecosystem) | [Ecosystem](/project/ecosystem) · [Roadmap](/project/roadmap) · [Limitations](/project/limitations) | Status and plans |

## Highlights

| | |
|---|---|
| **8 integrations** | GitHub, GitLab, JIRA, webhooks, RSS/Atom, Figma, OpenProject, ChallengeHound |
| **No database** | Config stored as Matrix room state events |
| **Bidirectional** | Receive notifications, send commands, map emoji reactions |
| **Programmable** | JavaScript transformation functions in a sandboxed runtime |
| **Production ready** | Prometheus, Sentry, Redis, workers, E2EE, health probes |
| **Fine-grained permissions** | Per-user, per-service, per-domain access control |

## Quick links

- **New here?** → [Quickstart](/get-started/quickstart) or [Evaluate](/get-started/evaluate)
- **Setting up GitHub?** → [GitHub Integration](/integrations/github)
- **Deploying to production?** → [Installation](/guides/operator/installation) → [Configuration](/guides/operator/configuration)
- **Something broken?** → [Troubleshooting](/troubleshooting/)
- **Contributing?** → [Architecture](/architecture/connections) → [Extensibility](/architecture/extensibility)
