---
title: Evaluate Hookshot
description: Feature matrix, boundaries, and decision criteria for evaluating hookshot
audience: [evaluator, architect]
---

# Evaluate Hookshot

This page helps you decide if hookshot fits your needs. No setup required — just information.

## What hookshot does well

- **Multi-service integration in one deployment.** One appservice bridges GitHub, GitLab, JIRA, webhooks, feeds, Figma, and OpenProject. No separate bot per service.
- **Configuration via Matrix rooms.** Connections are stored as room state events. No external database. Config travels with rooms, survives room upgrades, works with federation.
- **Extensible webhook handling.** Generic webhooks with JavaScript transformation functions let you integrate any service that can send HTTP.
- **Fine-grained permissions.** Per-user, per-service, per-domain permission control. Different teams can have different access levels.
- **Production-ready.** Prometheus metrics, Sentry integration, Redis caching, worker scaling, E2EE support.

## What hookshot does NOT do

- **Full conversation sync.** Hookshot delivers notifications and accepts commands. It does not mirror entire chat histories between Matrix and Slack/Discord/etc. For that, use [matrix-appservice-slack](https://github.com/matrix-org/matrix-appservice-slack) or [mautrix bridges](https://mau.fi/bridges/).
- **Bidirectional issue sync.** Hookshot can create issues on external services and receive notifications. It does not keep issues synchronized between services.
- **Custom bot logic.** Hookshot has fixed integration logic. For custom bot behavior, use [matrix-bot-sdk](https://github.com/turt2live/matrix-bot-sdk) directly.
- **Multi-homeserver deployment.** One hookshot instance connects to one homeserver.

## Capability matrix

| | GitHub | GitLab | JIRA | Webhooks | Feeds | Figma | OpenProject | ChallengeHound |
|---|---|---|---|---|---|---|---|---|
| Receive notifications | 23 events | 12 events | 5 events | Any payload | New entries | Comments | Work packages | Activities |
| Bot commands | 4 | 3 | 3 | — | — | — | 5 | — |
| OAuth | GitHub App + user | Token | Cloud OAuth 2.0, Server OAuth 1.0 | — | — | — | OAuth 2.0 | — |
| Webhook-based | Yes | Yes | Yes | Yes | No (polling) | Yes | Yes | No (polling) |
| Widget UI | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Dynamic rooms | Yes | Yes | — | — | — | — | — | — |
| Enterprise/self-hosted | Yes | Yes | Yes (Cloud + Server) | N/A | N/A | N/A | Yes | N/A |

## Deployment requirements

| Requirement | Details |
|---|---|
| Homeserver | Synapse, Dendrite, or Conduit with appservice support |
| Runtime | Node.js 22+ with Rust native modules (or Docker) |
| Memory | ~100 MB baseline, grows with room count |
| Storage | Encrypted token file (passkey.pem). Optional: Redis for caching |
| Network | Outbound: homeserver API. Inbound: webhook endpoints (must be public for webhook services) |
| Database | None — Matrix room state is the primary store |

## Comparison with alternatives

| Feature | Hookshot | Standalone bots | Custom appservice |
|---|---|---|---|
| Multi-service | 8 services in one | One bot per service | Build your own |
| Setup complexity | Medium (config + registration) | Low per bot | High |
| Matrix-native storage | Yes (room state) | Usually external DB | Your choice |
| Permission system | Built-in, fine-grained | Per-bot | Build your own |
| Webhook transformation | JavaScript sandbox | Custom code | Custom code |
| Maintenance | One deployment | N deployments | Your code |

## Architecture fit

```
┌─────────────────────┐
│   Matrix Homeserver  │
│   (Synapse/Dendrite) │
├─────────────────────┤
│  Appservice API      │◄──── Hookshot registers here
└──────────┬──────────┘
           │
    ┌──────▼──────┐
    │   Hookshot   │◄──── Single process (or workers)
    │              │      No external DB required
    └──┬───┬───┬──┘      Optional: Redis cache
       │   │   │
       ▼   ▼   ▼
    GitHub GitLab JIRA ... (webhook endpoints)
```

Hookshot adds ~100 MB memory overhead to your Matrix deployment. It communicates with the homeserver over HTTP (appservice API). External services reach hookshot over HTTP (webhooks).

## Known limitations

- JIRA Server reached EOL February 2024. Hookshot still supports it but the `jira-client` package is unmaintained.
- `figma-js` package is unmaintained (pre-release pin). Figma integration works but the dependency is a risk.
- Generic webhooks have no signature verification — URL secrecy is the only protection.
- No built-in rate limiting for outbound API calls.
- Room state as storage means no cross-room queries (e.g., "list all GitHub connections").

## Next steps

| I want to... | Go to |
|---|---|
| Try it now | [Quickstart](quickstart.md) |
| Understand the architecture | [What is Hookshot](../understand/what-is-hookshot.md) |
| See all integrations | [Integration Overview](../integrations/overview.md) |
| Plan a production deployment | [Installation](../guides/operator/installation.md) |
| Understand the security model | [Trust and Boundaries](../understand/trust-and-boundaries.md) |

## Related

- [What is Hookshot](../understand/what-is-hookshot.md) — System overview
- [Integration Overview](../integrations/overview.md) — All capabilities
- [Architecture: Connections](../architecture/connections.md) — How it works inside
