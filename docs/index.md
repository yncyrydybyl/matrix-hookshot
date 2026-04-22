---
title: Matrix Hookshot
---

# Matrix Hookshot

Welcome! Hookshot connects your Matrix rooms to the services your team already uses — GitHub, GitLab, JIRA, webhooks, RSS feeds, Figma, and OpenProject. One bridge, one deployment, everything connected.

Whether you're an operator deploying hookshot, a developer building on its APIs, or a user setting up notifications in your Matrix room — you'll find what you need here.

## Where to start

| I want to... | Go here |
|---|---|
| Try it in 5 minutes | [Quickstart](./get-started/quickstart.md) |
| Understand what hookshot does | [What is Hookshot?](./understand/what-is-hookshot.md) |
| See which services are supported | [Integration Overview](./integrations/overview.md) |
| Decide if hookshot fits my needs | [Evaluate](./get-started/evaluate.md) |
| Deploy to production | [Installation](./guides/operator/installation.md) |
| Fix something that's broken | [Troubleshooting](./troubleshooting/index.md) |
| Connect GitHub to a room | [GitHub Integration](./integrations/github.md) |
| Set up a generic webhook | [First Webhook Tutorial](./get-started/first-webhook.md) |
| Understand the architecture | [Connections](./architecture/connections.md) |
| Add a new integration | [Extensibility Guide](./architecture/extensibility.md) |

## All sections

| Section | What's inside |
|---|---|
| [Get Started](./get-started/quickstart.md) | Quickstart, tutorials, evaluation guide |
| [Understand](./understand/what-is-hookshot.md) | How hookshot works — event lifecycle, integration model, trust boundaries, glossary |
| [Integrations](./integrations/overview.md) | GitHub, GitLab, JIRA, webhooks, feeds, Figma, OpenProject, ChallengeHound |
| [Operator Guides](./guides/operator/installation.md) | Install, configure, monitor, encrypt, scale, harden |
| [Architecture](./architecture/connections.md) | Connections, state & storage, components, extensibility, failure recovery |
| [Reference](./reference/bot-commands.md) | Bot commands, event types, provisioning API, metrics, Matrix spec map |
| [Troubleshooting](./troubleshooting/index.md) | Webhooks not arriving, auth issues, connection problems, common errors |
| [Project](./project/ecosystem.md) | Ecosystem, roadmap, known limitations |

## At a glance

Hookshot bridges **8 services** through **15 connection types** with **60+ bot commands**. It stores configuration as Matrix room state events — no database needed. Events flow bidirectionally: receive notifications from external services, send commands back from Matrix.

It's been in production since 2021, has 60+ releases, and is deployed via Docker, Helm, Ansible, NixOS, and the Element Server Suite.

[Read more about what hookshot is](./understand/what-is-hookshot.md) or [jump straight to the quickstart](./get-started/quickstart.md).
