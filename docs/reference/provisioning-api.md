---
title: Provisioning API Reference
description: REST API for managing hookshot connections programmatically
audience: [developer, operator]
---

# Provisioning API Reference

Hookshot exposes a REST API for managing [connections](../architecture/connections.md) programmatically. This is the same API the [widget UI](../guides/operator/configuration.md#widgets-optional) uses internally.

**Base path:** `/widgetapi/v1/`

**Authentication:** OpenID token verification via widget tokens (prefix: `hookshot_`). All requests require a valid `userId`.

**Listener:** Bind to a listener with the `widgets` resource. See [listener configuration](../guides/operator/configuration.md#listeners-required).

<!-- Code: src/widgets/BridgeWidgetApi.ts -->

## Endpoints

### State and config

| Method | Path | Description |
|---|---|---|
| GET | `/v1/state` | Get bridge state for the authenticated user |
| GET | `/v1/config/sections` | Get enabled configuration sections |
| GET | `/v1/service/:service/config` | Get public config for a service |

#### GET `/v1/config/sections`

Returns which services are configured:

```json
{
  "general": true,
  "github": true,
  "gitlab": true,
  "generic": true,
  "jira": false,
  "figma": false,
  "feeds": true,
  "openproject": false
}
```

### Connection management

| Method | Path | Description |
|---|---|---|
| GET | `/v1/:roomId/connections` | List all connections in a room |
| GET | `/v1/:roomId/connections/:service` | List connections for a specific service |
| POST | `/v1/:roomId/connections/:type` | Create a new connection |
| PUT | `/v1/:roomId/connections/:connectionId` | Update a connection |
| PATCH | `/v1/:roomId/connections/:connectionId` | Update a connection (alias for PUT) |
| DELETE | `/v1/:roomId/connections/:connectionId` | Remove a connection |

#### GET `/v1/:roomId/connections`

Returns all connections with user [permission](../guides/operator/configuration.md#permissions) details:

```json
[
  {
    "type": "uk.half-shot.matrix-hookshot.github.repository",
    "stateKey": "my-org/my-repo",
    "config": { "org": "my-org", "repo": "my-repo", "enableHooks": [...] },
    "canEdit": true,
    "canSendMessages": true
  }
]
```

#### POST `/v1/:roomId/connections/:type`

Create a connection. The `:type` is the connection class name (e.g., `GitHubRepo`, `GenericHook`, `FeedConnection`).

Request body varies by type. Example for [generic webhook](../integrations/generic-webhooks.md):

```json
{
  "name": "ci-alerts",
  "transformationFunction": "result = { version: 'v2', plain: data.text };"
}
```

Response includes the created connection config (and webhook URL for generic hooks).

**Permission required:** `manageConnections` level. See [permissions](../guides/operator/configuration.md#permissions).

**Validates** command prefix conflicts before creation.

#### PUT/PATCH `/v1/:roomId/connections/:connectionId`

Update connection configuration. Static connections (defined in `config.yml`) cannot be modified via API.

#### DELETE `/v1/:roomId/connections/:connectionId`

Remove a connection. Static connections cannot be deleted via API. Calls `connection.onRemove()` for cleanup.

### Connection targets

| Method | Path | Description |
|---|---|---|
| GET | `/v1/targets/:type` | List available targets for a connection type |

Returns targets the authenticated user can connect to (e.g., GitHub repos the user's App is installed on, GitLab projects the user has access to).

### Authentication

| Method | Path | Description |
|---|---|---|
| GET | `/v1/service/:service/auth` | Start OAuth flow or check auth status |
| GET | `/v1/service/:service/auth/:state` | Poll OAuth completion |
| POST | `/v1/service/:service/auth/logout` | Log out from a service |

#### GET `/v1/service/:service/auth`

Returns either authenticated status or an OAuth URL:

```json
// Authenticated:
{ "authenticated": true, "user": { "login": "octocat" } }

// Not authenticated:
{ "authenticated": false, "authUrl": "https://github.com/login/oauth/authorize?...", "stateId": "abc123" }
```

Supported services: `github`, `jira`, `openproject`. See [authentication](../understand/trust-and-boundaries.md) for auth models.

#### GET `/v1/service/:service/auth/:state`

Poll for OAuth completion:

```json
{ "state": "waiting" }
// or
{ "state": "complete" }
```

### Security

- All endpoints check user power levels via `PLManager`
- Read operations require room membership
- Write operations (create/update/delete) require appropriate power level
- IP range filtering configurable via [widget config](../guides/operator/configuration.md#widgets-optional)
- Static connections are immutable via API

## Related

**Concepts:** [Integration Model](../understand/integration-model.md) — Four ways to create connections · [Trust and Boundaries](../understand/trust-and-boundaries.md) — Auth model

**Architecture:** [Connections](../architecture/connections.md) — Connection lifecycle

**Integrations:** [Overview](../integrations/overview.md) · [Generic Webhooks: Provisioning](../integrations/generic-webhooks.md#create-via-provisioning-api)

**Operator:** [Configuration: Widgets](../guides/operator/configuration.md#widgets-optional) · [Hardening](../guides/operator/hardening.md#widget-ip-filtering)

**Troubleshooting:** [Connection Issues](../troubleshooting/connection-issues.md) · [Authentication](../troubleshooting/authentication.md)
