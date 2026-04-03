---
title: Troubleshooting
description: Find and fix common hookshot problems
audience: [operator, user]
---

# Troubleshooting

Start with the symptom. Find your problem below and follow the link to the diagnostic page.

## Quick checks

Before diving into specific problems, verify the basics:

1. **Is hookshot running?** Check `docker logs hookshot` or your process manager
2. **Can hookshot reach the homeserver?** Look for `Homeserver is ready` in logs
3. **Is the bot in the room?** Invite `@hookshot:yourdomain` if not
4. **Do you see errors in logs?** Set `logging.level: debug` temporarily

## By symptom

| Symptom | Likely area | Page |
|---|---|---|
| Webhook sent but no message in room | Webhook routing, connection config | [Webhooks Not Arriving](webhooks-not-arriving.md) |
| Bot doesn't respond to commands | Permission, prefix, bot not in room | [Connection Issues](connection-issues.md) |
| "Not authorized" error | OAuth expired or not set up | [Authentication](authentication.md) |
| Bot joined but no notifications | Connection not created or events disabled | [Connection Issues](connection-issues.md) |
| Duplicate messages | Multiple connections to same resource | [Connection Issues](connection-issues.md) |
| Encryption errors on startup | Crypto store missing or misconfigured | [Encryption](encryption.md) |
| Slow performance | Too many rooms, Redis not configured | [Performance](performance.md) |

## By service

| Service | Common problem | Quick fix |
|---|---|---|
| GitHub | No webhooks arriving | Verify webhook URL in GitHub App settings, check secret |
| GitLab | Token rejected | Re-set token: `!hookshot gitlab personaltoken <instance> <token>` |
| JIRA | OAuth flow fails | Check `oauth` config, verify redirect URI matches |
| Generic webhooks | 404 on webhook URL | Recreate webhook: `!hookshot webhook <name>` |
| Feeds | Feed not updating | Check `!hookshot feed list` for error status |

## Log reading guide

Hookshot logs at these levels:

| Level | What it shows |
|---|---|
| `error` | Things that need human attention |
| `warn` | Recoverable issues |
| `info` | Lifecycle events (startup, connection created, webhook received) |
| `debug` | Detailed flow (event routing, message formatting) |

Set `logging.level: debug` in config to see full event flow. Set back to `info` for production.

```yaml
logging:
  level: debug    # Temporary — verbose
  colorize: true
  json: false
```

## Getting help

- Search [GitHub issues](https://github.com/matrix-org/matrix-hookshot/issues)
- Ask in [#hookshot:half-shot.uk](https://matrix.to/#/#hookshot:half-shot.uk)
- Include: hookshot version, homeserver type/version, relevant config (redact secrets), and log output at debug level

## Related

- [Webhooks Not Arriving](webhooks-not-arriving.md)
- [Authentication](authentication.md)
- [Connection Issues](connection-issues.md)
- [Reference: Metrics](../reference/metrics.md)
