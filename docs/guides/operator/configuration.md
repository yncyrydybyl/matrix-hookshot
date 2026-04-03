---
title: Configuration
description: Hookshot configuration walkthrough — bridge, listeners, permissions, services, and operational settings
audience: [operator]
---

# Configuration

Hookshot is configured via a YAML file (`config.yml`). This page walks through each section. For the complete sample, see [`config.sample.yml`](https://github.com/matrix-org/matrix-hookshot/blob/main/config.sample.yml).

## Bridge (required)

Connects hookshot to the Matrix homeserver.

```yaml
bridge:
  domain: example.com          # Homeserver's server name
  url: http://localhost:8008   # Client-server API URL (hookshot → homeserver)
  mediaUrl: https://example.com  # Optional: public media URL
  port: 9993                   # Appservice listener port
  bindAddress: 127.0.0.1       # Appservice bind address (0.0.0.0 for Docker)
```

The `port` and `bindAddress` here are for the **appservice API** (homeserver → hookshot). This must NOT be publicly accessible. It listens on `/_matrix/app/`.

<!-- Code: src/config/Config.ts BridgeConfigBridge interface -->

## Logging (required)

```yaml
logging:
  level: info        # debug | info | warn | error
  colorize: true     # Color output (disable for log aggregators)
  json: false        # Structured JSON output (enable for logstash/etc.)
  timestampFormat: HH:mm:ss:SSS
```

JSON log schema:

```json
{
  "level": "WARN",
  "message": "Failed to connect to homeserver",
  "module": "Bridge",
  "timestamp": "11:45:02:198",
  "error": "connect ECONNREFUSED 127.0.0.1:8008"
}
```

## Pass file (required)

```yaml
passFile: ./passkey.pem
```

RSA key for encrypting stored OAuth tokens. Generate with:

```bash
openssl genpkey -out passkey.pem -outform PEM -algorithm RSA -pkeyopt rsa_keygen_bits:4096
```

**This key protects all stored credentials.** See [Trust and Boundaries](../../understand/trust-and-boundaries.md).

## Listeners (required)

HTTP listeners bind hookshot's endpoints to ports.

```yaml
listeners:
  - port: 9000
    bindAddress: 0.0.0.0
    resources:
      - webhooks           # Inbound webhooks from external services
  - port: 9001
    bindAddress: 127.0.0.1
    resources:
      - metrics            # Prometheus /metrics endpoint
      - provisioning       # REST API at /v1/...
  - port: 9002
    bindAddress: 0.0.0.0
    resources:
      - widgets            # Widget API at /widgetapi/v1/...
```

Each listener must use a **unique port**. Resources:

| Resource | Path prefix | Public? | Purpose |
|---|---|---|---|
| `webhooks` | `/github/webhook`, `/gitlab`, `/jira`, `/webhook/*`, etc. | Yes | Receive external webhooks |
| `metrics` | `/metrics` | No | Prometheus scraping |
| `provisioning` | `/v1/...` | No | REST API for management |
| `widgets` | `/widgetapi/v1/...` | Depends | Widget frontend + API |

The `webhooks` listener must be reachable from the internet for webhook-based integrations.

Optional: set a `prefix` on a listener to put all routes under a path:

```yaml
  - port: 9000
    bindAddress: 0.0.0.0
    prefix: "/hookshot"
    resources:
      - webhooks
```

### Reverse proxy (nginx example)

```nginx
# Webhooks (public)
location /hookshot/ {
    proxy_pass http://127.0.0.1:9000/;
}

# Widget API (authenticated via Matrix)
location /widgetapi/ {
    proxy_pass http://127.0.0.1:9002/widgetapi/;
}
```

<!-- Code: src/ListenerService.ts:31-141, docs/setup.md:193-250 -->

## Permissions

Controls who can use hookshot and at what level.

```yaml
permissions:
  - actor: example.com          # All users on this domain
    services:
      - service: "*"            # All services
        level: admin
```

### Actors

| Actor format | Matches |
|---|---|
| `example.com` | All users on that homeserver |
| `"@user:example.com"` | Specific user (quotes required) |
| `"!roomId:example.com"` | All members of that room (quotes required) |
| `"*"` | Everyone (quotes required) |

### Permission levels (ascending)

| Level | Can do |
|---|---|
| `commands` | Run bot commands in connected rooms |
| `login` | Above + authenticate with external services |
| `notifications` | Above + bridge personal notifications (GitHub only) |
| `manageConnections` | Above + create/delete connections |
| `admin` | Full access including admin operations |

Permissions are **additive** — if any rule matches positively, the highest level is granted.

### Example

```yaml
permissions:
  # Everyone can use commands
  - actor: "*"
    services:
      - service: "*"
        level: commands
  # Engineering team can manage all connections
  - actor: engineering.example.com
    services:
      - service: "*"
        level: manageConnections
  # One admin user
  - actor: "@alice:example.com"
    services:
      - service: "*"
        level: admin
```

<!-- Code: src/config/permissions.rs (Rust NAPI), docs/setup.md:92-191 -->

## Cache (optional)

Redis-backed cache improves startup times and enables feed persistence across restarts.

```yaml
cache:
  redisUri: "redis://localhost:6379"
```

Without Redis, feed state is lost on restart (entries may be re-posted).

## Service configuration

Each integration has its own config section. Only configure services you need — unconfigured services are disabled.

| Service | Config key | Documentation |
|---|---|---|
| GitHub | `github` | [GitHub Integration](../../integrations/github.md) |
| GitLab | `gitlab` | [GitLab setup](../../integrations/overview.md#gitlab) |
| JIRA | `jira` | [JIRA setup](../../integrations/overview.md#jira) |
| Generic webhooks | `generic` | [Generic Webhooks](../../integrations/generic-webhooks.md) |
| RSS/Atom feeds | `feeds` | [Feeds setup](../../integrations/overview.md#feeds) |
| Figma | `figma` | [Figma setup](../../integrations/overview.md#figma) |
| OpenProject | `openProject` | [OpenProject setup](../../integrations/overview.md#openproject) |
| ChallengeHound | `challengeHound` | [ChallengeHound setup](../../integrations/overview.md#challengehound) |

Minimal example — enable only generic webhooks:

```yaml
generic:
  enabled: true
  urlPrefix: https://hookshot.example.com/webhook/
```

## Bot profile (optional)

```yaml
bot:
  displayname: Hookshot Bot
  avatar: mxc://example.com/avatar-mxc-url
```

## Service bots (optional)

Run dedicated bot users for specific services:

```yaml
serviceBots:
  - localpart: feeds
    displayname: Feeds
    avatar: ./assets/feeds_avatar.png
    prefix: "!feeds"
    service: feeds
```

## Widgets (optional)

Enable the web widget for configuring connections in Matrix clients:

```yaml
widgets:
  addToAdminRooms: false
  publicUrl: https://hookshot.example.com/widgetapi/v1/static/
  roomSetupWidget:
    addOnInvite: false
```

## Encryption (optional)

Enable end-to-end encryption support:

```yaml
encryption:
  storagePath: ./cryptostore
```

Requires `cache.redisUri` to be set. The `storagePath` must persist between restarts.

See [Encryption docs](../../docs/advanced/encryption.md) for full details.

## Metrics (optional)

```yaml
metrics:
  enabled: true
```

Exposes Prometheus metrics on the listener bound to the `metrics` resource.

See [Reference: Metrics](../../reference/metrics.md).

## Sentry (optional)

```yaml
sentry:
  dsn: https://examplePublicKey@o0.ingest.sentry.io/0
  environment: production
```

## Static connections (optional)

Pre-define connections without using bot commands:

```yaml
connections:
  - connectionType: uk.half-shot.matrix-hookshot.generic.hook
    stateKey: ci-alerts
    roomId: "!roomId:example.com"
    state:
      name: CI Alerts
```

These are created on startup. Useful for automated deployments.

## Validate

```bash
yarn validate-config
```

This checks for missing required fields and invalid values without starting the bridge.

## Related

- [Installation](installation.md) — Install hookshot
- [Trust and Boundaries](../../understand/trust-and-boundaries.md) — Security model
- [Integration Overview](../../integrations/overview.md) — Service-specific config
- [Reference: Configuration](../../reference/configuration.md) — Full config schema (auto-generated)
