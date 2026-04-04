---
title: JIRA Integration
description: Connect Matrix rooms to JIRA projects for issue and version notifications
audience: [user, operator, developer]
integration: jira
status: current
---

# JIRA

Hookshot connects Matrix rooms to JIRA projects. It delivers notifications for issue creation, updates, and version events. It accepts commands to create and assign issues.

Supports both **JIRA Cloud** (Atlassian-hosted) and **JIRA Server/Data Center** (self-hosted) with different auth flows.

## Capabilities

| Capability | Supported |
|---|---|
| Receive events in Matrix | Yes — issue created, updated; version created/updated/released |
| Send commands from Matrix | Yes — 3 commands |
| OAuth | Cloud: OAuth 2.0 / Server: OAuth 1.0 (RSA-SHA1) |
| Webhook-based | Yes |
| Bot commands | `!jira` prefix |
| Widget UI | Yes |
| Provisioning API | Yes |

## Supported events

| JIRA event | Handler | Topic | Filterable |
|---|---|---|---|
| Issue created | `onJiraIssueCreated` | `jira.issue_created` | Yes (default: enabled) |
| Issue updated | `onJiraIssueUpdated` | `jira.issue_updated` | Yes |
| Version created | `onJiraVersionEvent` | `jira.version_created` | Yes |
| Version updated | `onJiraVersionEvent` | `jira.version_updated` | Yes |
| Version released | `onJiraVersionEvent` | `jira.version_released` | Yes |

Events can be filtered per-connection via the `events` array in the connection state.

> **Source:** [`src/Connections/JiraProject.ts:37-57`](https://github.com/matrix-org/matrix-hookshot/blob/main/src/Connections/JiraProject.ts#L37-L57)

> **Source:** [`src/Bridge.ts:808-823`](https://github.com/matrix-org/matrix-hookshot/blob/main/src/Bridge.ts#L808-L823)

## Authentication

### JIRA Cloud (OAuth 2.0)

1. Create an OAuth 2.0 (3LO) app at [developer.atlassian.com](https://developer.atlassian.com/console/myapps/create-3lo-app/)
2. Enable permissions: User REST, Jira Platform REST, User Identity APIs
3. Enable rotating tokens under Authorization
4. Set callback URL to `https://<hookshot>/jira/oauth`
5. Copy Client ID and Secret

Config:

```yaml
jira:
  webhook:
    secret: "your-webhook-secret"
  oauth:
    client_id: "your-client-id"
    client_secret: "your-client-secret"
    redirect_uri: "https://hookshot.example.com/jira/oauth"
```

The `redirect_uri` must exactly match the callback URL in Atlassian's settings.

User login: `!hookshot jira login` → opens OAuth flow in browser.

<!-- External: https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/ -->

### JIRA Server / Data Center (OAuth 1.0)

Requires RSA key pair for OAuth 1.0 with RSA-SHA1 signing.

```bash
openssl genrsa -out jira_privatekey.pem 4096
openssl rsa -in jira_privatekey.pem -pubout -out jira_publickey.pem
```

Config:

```yaml
jira:
  url: https://jira.internal.com   # Required for on-premise
  webhook:
    secret: "your-webhook-secret"
  oauth:
    consumerKey: "your-consumer-key"
    privateKey: jira_privatekey.pem
    redirect_uri: "https://hookshot.example.com/jira/oauth"
```

Then configure an Application Link in JIRA:
1. Administration → Applications → Application Links
2. Enter any URL, click Continue
3. Set Application Name, Type: Generic Application, enable "Create incoming link"
4. Enter your `consumerKey`, any consumer name, and the public key from `jira_publickey.pem`

> **Source:** docs/setup/jira.md:79-117 (full on-premise setup steps)

## Webhook setup

### Cloud

See [Atlassian webhook docs](https://support.atlassian.com/jira-cloud-administration/docs/manage-webhooks/). Set the webhook secret to match your config.

### Server / Data Center

Settings → System → WebHooks. Point to `https://<hookshot>/jira/webhook?secret=your-webhook-secret`.

Enable issue and version events.

## Bot commands

| Command | Description | Example |
|---|---|---|
| `!jira create <title>` | Create an issue | `!jira create "Login bug"` |
| `!jira issue-types` | List issue types for the project | `!jira issue-types` |
| `!jira assign <number> <user>` | Assign an issue | `!jira assign PROJ-42 jane` |

Admin commands (DM with bot):

| Command | Description |
|---|---|
| `!hookshot jira login` | Start OAuth flow |
| `!hookshot jira logout` | Clear stored credentials |
| `!hookshot jira whoami` | Check JIRA identity |

## Setup: Connect a room

```
!hookshot jira project https://jira.example.com/projects/PROJ
```

Or use the widget UI.

## Webhook verification

JIRA webhooks are verified using two strategies:

1. **Query parameter secret** — On-premise JIRA appends `?secret=...` to the webhook URL. Hookshot compares directly.
2. **HMAC-SHA256 signature** — JIRA Cloud sends `x-hub-signature` header with `sha256=<hex>` format.

Hookshot auto-detects Cloud vs On-Premise by checking for the `x-atlassian-webhook-identifier` header.

> **Source:** [`src/jira/Router.ts:48-87`](https://github.com/matrix-org/matrix-hookshot/blob/main/src/jira/Router.ts#L48-L87)

## Limitations

- `jira-client` npm package (v8.2.2) is unmaintained — last meaningful update was years ago
- JIRA Server reached EOL February 2024 — hookshot still supports it but Data Center may behave differently
- OAuth 1.0 with RSA-SHA1 for Server is legacy — Data Center supports OAuth 2.0 but hookshot doesn't implement it for on-premise
- On-Premise OAuth 1.0a tokens have no refresh capability — users must re-authenticate when tokens expire
- Only issue and version events are supported — no board, sprint, or comment events
- Cloud OAuth tokens auto-refresh; accessible resources cached with 60s TTL
- The split between Cloud and Server clients adds maintenance burden

## Upstream references

| Topic | URL |
|---|---|
| JIRA Cloud REST API | [developer.atlassian.com](https://developer.atlassian.com/cloud/jira/platform/rest/v3/) |
| JIRA Cloud webhooks | [Atlassian webhook docs](https://support.atlassian.com/jira-cloud-administration/docs/manage-webhooks/) |
| OAuth 2.0 (3LO) | [Atlassian OAuth docs](https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/) |

## Related

**Concepts:** [Event Lifecycle](../understand/event-lifecycle.md) · [Integration Model](../understand/integration-model.md) · [Trust and Boundaries](../understand/trust-and-boundaries.md)

**Integrations:** [Overview](overview.md) · [GitHub](github.md) · [GitLab](gitlab.md) · [OpenProject](openproject.md) — Similar project tracking

**Reference:** [Bot Commands: JIRA](../reference/bot-commands.md#jira-project-commands) · [Event Types](../reference/event-types.md)

**Operator:** [Configuration](../guides/operator/configuration.md) · [Hardening](../guides/operator/hardening.md)

**Troubleshooting:** [Authentication](../troubleshooting/authentication.md) · [Webhooks Not Arriving](../troubleshooting/webhooks-not-arriving.md) · [Common Errors](../troubleshooting/common-errors.md)
