---
title: OpenProject Integration
description: Connect Matrix rooms to OpenProject for work package notifications and management
audience: [user, operator]
integration: openproject
status: current
---

# OpenProject

Hookshot connects Matrix rooms to OpenProject instances. It delivers notifications for work package creation and updates, and accepts commands to create, close, assign, and prioritize work packages.

## Capabilities

| Capability | Supported |
|---|---|
| Receive events | Yes — work package created/updated |
| Bot commands | Yes — 5 commands (`!op` prefix) |
| OAuth | Yes — OAuth 2.0 with token refresh |
| Webhook-based | Yes |
| Widget UI | Yes |
| Provisioning API | Yes |

## Supported events

| Event | Handler | Topic |
|---|---|---|
| Work package created | `onWorkPackageCreated` | `openproject.work_package:created` |
| Work package updated | `onWorkPackageUpdated` | `openproject.work_package:updated` |

<!-- Code: src/Bridge.ts:1001-1012 -->

## Configuration

### OpenProject side

1. **Webhooks**: Administration → API and Webhooks → Webhooks. Create webhook:
   - URL: `https://<hookshot>/openproject/webhook`
   - Secret: must match config
   - Events: Work packages

2. **OAuth application**: Administration → Authentication → OAuth Applications:
   - Redirect URL: `https://<hookshot>/openproject/oauth`
   - Scope: `api_v3`
   - Confidential: enabled
   - Note the Client ID and Secret

### Hookshot config

```yaml
openProject:
  baseUrl: https://your-openproject.com
  webhook:
    secret: "your-webhook-secret"
  oauth:
    clientId: "your-client-id"
    clientSecret: "your-client-secret"
    redirectUri: "https://hookshot.example.com/openproject/oauth"
```

<!-- Code: config.sample.yml openProject section -->

## Authentication

User login: `!hookshot openproject login` → OAuth 2.0 flow in browser.

Logout: `!hookshot openproject logout`

## Bot commands

| Command | Description | Example |
|---|---|---|
| `!op create <title>` | Create a work package | `!op create "New feature"` |
| `!op close <id>` | Close a work package | `!op close 42` |
| `!op priority <id> <priority>` | Set priority | `!op priority 42 high` |
| `!op assign <id> <user>` | Assign to user | `!op assign 42 jane` |
| `!op responsible <id> <user>` | Set responsible user | `!op responsible 42 bob` |

## Setup: Connect a room

```
!hookshot openproject add <project-url>
```

Remove: `!hookshot openproject remove <project-url>`

## Limitations

- Only work package events are supported — no time entries, meetings, or wiki events
- State event type uses `org.matrix.matrix-hookshot.openproject.project` (different prefix from other integrations)
- Raw HTTP calls (no SDK) — manual maintenance for API changes

## Upstream references

| Topic | URL |
|---|---|
| OpenProject webhooks | [openproject.org/docs/.../webhooks](https://www.openproject.org/docs/system-admin-guide/api-and-webhooks/#webhooks) |
| OpenProject API v3 | [openproject.org/docs/.../api](https://www.openproject.org/docs/api/) |
| OAuth applications | [openproject.org/docs/.../oauth](https://www.openproject.org/docs/system-admin-guide/authentication/oauth-applications/) |

## Related

**Concepts:** [Event Lifecycle](../understand/event-lifecycle.md) · [Integration Model](../understand/integration-model.md)

**Integrations:** [Overview](overview.md) · [JIRA](jira.md) — Similar project tracking

**Reference:** [Bot Commands: OpenProject](../reference/bot-commands.md#openproject-commands) · [Event Types](../reference/event-types.md)

**Operator:** [Configuration](../guides/operator/configuration.md) · [Hardening](../guides/operator/hardening.md)

**Troubleshooting:** [Authentication](../troubleshooting/authentication.md) · [Connection Issues](../troubleshooting/connection-issues.md)
