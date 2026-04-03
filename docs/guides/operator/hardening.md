---
title: Hardening
description: Security best practices for production hookshot deployments
audience: [operator, architect]
---

# Hardening

Security recommendations for production deployments. Read [Trust and Boundaries](../../understand/trust-and-boundaries.md) first for the full security model.

## Credential protection

### Files to protect

| File | Contains | Consequence if leaked |
|---|---|---|
| `config.yml` | Webhook secrets, OAuth credentials | Webhook spoofing, credential theft |
| `registration.yml` | `as_token`, `hs_token` | Full bot impersonation on homeserver |
| `passkey.pem` | RSA key for token encryption | All stored OAuth tokens exposed |
| GitHub App `.pem` | GitHub App private key | Full API access to installed repos |
| `cryptostore/` | E2EE encryption keys | Decryption of encrypted messages |

**Rules:**
- File permissions: `chmod 600` on all credential files
- Never commit credentials to git — use `.gitignore`
- In Docker: mount as read-only volumes (`:ro`)
- Rotate secrets periodically (especially webhook secrets and OAuth credentials)

### Passkey rotation

If you rotate `passkey.pem`, all stored user tokens become unreadable. Users must re-authenticate via `!github login`, `!hookshot jira login`, etc. See [Authentication troubleshooting](../../troubleshooting/authentication.md#check-5-is-the-token-store-working).

## Network security

### Listener exposure

Only the `webhooks` listener needs public internet access. Everything else should be internal:

```yaml
listeners:
  - port: 9000
    bindAddress: 0.0.0.0      # Public — receives webhooks
    resources:
      - webhooks
  - port: 9001
    bindAddress: 127.0.0.1    # Internal only — metrics
    resources:
      - metrics
  - port: 9002
    bindAddress: 127.0.0.1    # Internal only — widget API
    resources:
      - widgets
      - provisioning
```

The [appservice port](configuration.md#bridge-required) (`bridge.port`) must only be reachable by the homeserver.

See [Listeners configuration](configuration.md#listeners-required) for details.

### Reverse proxy

Put hookshot behind a reverse proxy (nginx, Caddy, Traefik) that handles TLS. See the [nginx example](configuration.md#reverse-proxy-nginx-example).

### Webhook URL secrecy

[Generic webhook](../../integrations/generic-webhooks.md) URLs contain a UUID as their only protection — no signature verification. Treat them as secrets:
- Don't share webhook URLs in public channels
- Use [expiration dates](../../integrations/generic-webhooks.md#connection-options) for temporary webhooks
- Consider using [transformation functions](../../integrations/generic-webhooks.md#transformation-functions) to validate expected payload structure

For service-specific webhooks (GitHub, GitLab, JIRA), use strong webhook secrets. See each integration's setup:
- [GitHub: webhook secret](../../integrations/github.md#configuration)
- [GitLab: secret token](../../integrations/gitlab.md#configuration)
- [JIRA: webhook secret](../../integrations/jira.md#webhook-verification)

## Permission lockdown

Use [fine-grained permissions](configuration.md#permissions) to limit access:

```yaml
permissions:
  # Most users: commands only
  - actor: "*"
    services:
      - service: "*"
        level: commands
  # Team leads: manage connections
  - actor: "!team-room:example.com"
    services:
      - service: "*"
        level: manageConnections
  # Admins: full access
  - actor: "@admin:example.com"
    services:
      - service: "*"
        level: admin
```

See [Permission levels](configuration.md#permission-levels-ascending) for what each level allows. The [Trust and Boundaries](../../understand/trust-and-boundaries.md#permission-system) page explains the Rust-based permission engine.

## Transformation function safety

If you enable JavaScript [transformation functions](../../integrations/generic-webhooks.md#transformation-functions):

```yaml
generic:
  allowJsTransformationFunctions: true   # Only if needed
```

Functions run in a [QuickJS sandbox](../../understand/trust-and-boundaries.md#transformation-function-sandbox) — no network, filesystem, or module access. The risk is resource consumption (CPU time), mitigated by the 500ms timeout.

If you don't need transformations, leave `allowJsTransformationFunctions: false` (default).

## Widget IP filtering

The [widget API](configuration.md#widgets-optional) can filter IP ranges:

```yaml
widgets:
  disallowedIpRanges:
    - 127.0.0.0/8
    - 10.0.0.0/8
    - 172.16.0.0/12
    - 192.168.0.0/16
```

This prevents SSRF attacks through the widget provisioning API.

## Encryption

Enable [E2EE](encryption.md) for rooms containing sensitive notifications:

```yaml
encryption:
  storagePath: ./cryptostore
cache:
  redisUri: "redis://localhost:6379"
```

Note: encryption is [incompatible with worker mode](workers-and-scaling.md#constraints).

## Monitoring for security

Set up [monitoring](monitoring.md) and alert on:

| Metric / pattern | Indicates |
|---|---|
| `hookshot_webhooks_received_total` spike | Possible webhook flooding |
| `hookshot_matrix_messages_failed_total` increasing | Bot may have lost room access |
| Failed signature verifications in logs | Webhook secret compromise or misconfiguration |
| Unexpected `room.invite` events | Someone adding bot to rooms it shouldn't be in |

## Checklist

- [ ] All credential files have restricted permissions (`600`)
- [ ] No credentials committed to git
- [ ] Only `webhooks` listener is publicly accessible
- [ ] Appservice port is not publicly accessible
- [ ] TLS termination via reverse proxy
- [ ] Webhook secrets are strong random values (≥32 chars)
- [ ] [Permissions](configuration.md#permissions) configured with principle of least privilege
- [ ] Generic webhook URLs treated as secrets
- [ ] `allowJsTransformationFunctions` disabled if not needed
- [ ] Widget IP filtering enabled if widgets are public
- [ ] [Monitoring](monitoring.md) and alerting configured
- [ ] Backup plan for `passkey.pem` and `cryptostore/`

## Related

- [Trust and Boundaries](../../understand/trust-and-boundaries.md) — Full security model
- [Configuration](configuration.md) — All config options
- [Encryption](encryption.md) — E2EE setup
- [Monitoring](monitoring.md) — Prometheus and alerting
- [Troubleshooting: Authentication](../../troubleshooting/authentication.md) — Token and credential issues
