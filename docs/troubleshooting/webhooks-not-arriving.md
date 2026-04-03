---
title: "Troubleshooting: Webhooks Not Arriving"
description: Diagnose why external webhooks are not producing Matrix messages
audience: [operator, user]
symptoms: ["no messages in room", "webhook returns 200 but nothing happens", "webhook returns 404"]
---

# Webhooks Not Arriving

You configured a webhook but messages aren't appearing in your Matrix room. Work through these checks in order — most common causes first.

## Check 1: Is hookshot receiving the webhook?

Send a test request and check the HTTP response:

```bash
curl -v -X POST https://hookshot.example.com/{service}/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

| Response | Meaning | Next step |
|---|---|---|
| `200 {"ok":true}` | Hookshot received it | Problem is downstream — go to Check 2 |
| `404 Not Found` | URL doesn't match any connection | Verify the URL path. For generic webhooks, check the hookId. For GitHub, the path should be `/github/webhook`. |
| `401 Unauthorized` | Signature/secret mismatch | Check webhook secret in config matches the service's settings |
| `Connection refused` | Hookshot not listening on that port | Verify hookshot is running. Check `listeners` config — webhooks need a listener with `resources: [webhooks]` |
| `502 / 503` | Reverse proxy can't reach hookshot | Check your nginx/caddy config, ensure it proxies to the correct port |

### Check port and listener config

```yaml
# config.yml — webhooks must have a dedicated listener
listeners:
  - port: 9000
    bindAddress: 0.0.0.0    # 0.0.0.0 for Docker, 127.0.0.1 for localhost-only
    resources:
      - webhooks             # This listener serves webhooks
```

<!-- Code: src/ListenerService.ts:31-141 -->

If running in Docker, verify the port is exposed and mapped correctly.

## Check 2: Is the connection active?

In the Matrix room, send:

```
!hookshot list
```

This lists all connections in the room. Verify your integration appears.

If the connection is missing:
- Recreate it: `!hookshot github repo <url>` or `!hookshot webhook <name>`
- Check that the bot has permission to read room state (needs at least PL 0)

## Check 3: Is the event type enabled?

For service-specific webhooks (GitHub, GitLab, etc.), the connection may be filtering events.

For GitHub, check which hooks are enabled:

```
!gh help
```

Or check the room state event directly. The `enableHooks` array controls which events produce messages. For example, `push` events are disabled by default for GitHub.

<!-- Code: src/Connections/GithubRepo.ts:205-218 (default enabled events) -->

## Check 4: Is hookshot connected to the homeserver?

Check hookshot's logs:

```bash
# Docker
docker logs hookshot 2>&1 | grep -i "error\|appservice\|homeserver\|ready"
```

| Log message | Meaning |
|---|---|
| `Homeserver is ready` | Connection OK |
| `Failed to connect to homeserver` | Can't reach homeserver — check `bridge.url` in config |
| `Homeserver returned 403` | Registration rejected — check `registration.yaml` matches on both sides |
| `Error sending event` | Hookshot receives webhooks but can't send to Matrix |

## Check 5: Is the message being transformed away?

For generic webhooks with a transformation function, the function may return `null` (which suppresses the message) or throw an error silently.

Test with a minimal transformation:

```javascript
// Temporary: pass everything through
result = { version: "v2", plain: JSON.stringify(data) };
```

If messages appear with this transformation, the issue is in your transformation function.

## Check 6: Service-specific webhook verification

### GitHub

1. In your GitHub App settings, check "Recent Deliveries" — does GitHub show successful delivery?
2. Verify the webhook URL ends with `/github/webhook` (not `/github/` or `/webhook`)
3. Verify the webhook secret in GitHub App matches `github.webhook.secret` in config
4. Check that the GitHub App is installed on the target repository/organization

### GitLab

1. In your GitLab project → Settings → Webhooks, check "Recent events"
2. Verify the webhook URL points to `/gitlab`
3. Verify the secret token matches your config

### Generic webhooks

1. Verify the hookId in the URL matches an active webhook — send `!hookshot webhook list` in the room
2. Check if the webhook has expired (`expirationDate` in the connection config)

## Check 7: Check metrics

If you have Prometheus monitoring:

| Metric | What to check |
|---|---|
| `hookshot_webhooks_received_total` | Incrementing when you send webhooks? |
| `hookshot_matrix_messages_sent_total` | Incrementing? |
| `hookshot_matrix_messages_failed_total` | Incrementing? (problem sending to Matrix) |

## Still stuck?

1. Set `logging.level: debug` and send a test webhook
2. Look for the webhook request in logs — you should see the full routing path
3. If the webhook appears in logs but no message is sent, the issue is in the connection handler
4. If no log entry appears, the request isn't reaching hookshot (firewall, reverse proxy, or port issue)

## Related

- [Troubleshooting Index](index.md) — All troubleshooting pages
- [Generic Webhooks](../integrations/generic-webhooks.md) — Webhook setup and configuration
- [GitHub Integration](../integrations/github.md) — GitHub-specific setup
- [Reference: Metrics](../reference/metrics.md) — Prometheus metrics
