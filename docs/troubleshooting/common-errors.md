---
title: "Troubleshooting: Common Errors"
description: Error messages and their solutions
audience: [operator, user]
symptoms: ["error message", "exception", "startup failure"]
---

# Common Errors

Error messages sorted by when they occur.

## Startup errors

| Error | Cause | Fix |
|---|---|---|
| `Failed to connect to homeserver` | Homeserver unreachable at `bridge.url` | Check URL, ensure homeserver is running, check network/firewall |
| `Homeserver returned 403` | Appservice registration rejected | Verify `as_token`/`hs_token` match in both registration.yml and homeserver config. Restart homeserver after adding registration. |
| `This endpoint can only be called by appservices` | Encryption enabled but appservice not recognized | Check registration file is loaded by homeserver. See [#1137](https://github.com/matrix-org/matrix-hookshot/issues/1137) |
| `ENOENT: no such file or directory, open '...'` | Config references a file that doesn't exist | Check `passFile`, `github.auth.privateKeyFile` paths. Docker: ensure volumes are mounted correctly. |
| `Config validation failed` | Invalid config.yml | Run `yarn validate-config` for details |
| `Could not decrypt token store` | passkey.pem changed or corrupted | If key is lost, users must re-authenticate. Generate new key and restart. |

## Webhook errors

| Error | Cause | Fix |
|---|---|---|
| `Webhook signature verification failed` | Secret mismatch between hookshot and external service | Update `webhook.secret` in config to match the service's settings |
| `No handler found for webhook` | Webhook URL doesn't match any connection | Verify URL path. For generic webhooks, check hookId is valid. |
| `waitForComplete timed out` | Transformation function or processing took too long | Simplify transformation function. See [#1251](https://github.com/matrix-org/matrix-hookshot/issues/1251) |
| `Transformation function failed` | JavaScript error in transformation code | Test function with simpler input. Check for syntax errors. |
| `Static webhook setup with transformationFunction fails` | QuickJS not initialized at startup for static connections | See [#1228](https://github.com/matrix-org/matrix-hookshot/issues/1228) |

## Matrix message errors

| Error | Cause | Fix |
|---|---|---|
| `Failed to send event to room` | Bot can't send to the room | Check bot is a member. Check power levels. Check room isn't read-only. |
| `M_FORBIDDEN` | Bot lacks permission | Invite bot to room, or increase bot's power level |
| `M_ROOM_NOT_FOUND` | Room no longer exists | Connection is stale — remove it |
| `Event too large` | Message exceeds Matrix event size limit (65KB) | Large webhook payloads are trimmed automatically. If this persists, check transformation function output. |

## Authentication errors

| Error | Cause | Fix |
|---|---|---|
| `GitHub App authentication failed` | Wrong App ID or invalid private key | Verify `github.auth.id` and `github.auth.privateKeyFile` |
| `OAuth state mismatch` | Stale OAuth callback | Retry login flow |
| `Token refresh failed` | OAuth refresh token expired | User must re-authenticate |
| `Invalid redirect_uri` | Mismatch between config and service | Ensure exact match including trailing slash |

## Connection errors

| Error | Cause | Fix |
|---|---|---|
| `You do not have permission to use this command` | Insufficient permission level | Admin: check `permissions` config |
| `Service is not configured` | Trying to use a service not in config | Operator: add service section to config.yml |
| `Connection already exists` | Duplicate connection to same resource | Remove existing: `!hookshot list` then delete |
| `Could not validate connection state` | Invalid state event content | Check state event format matches expected schema |

## Feed errors

| Error | Cause | Fix |
|---|---|---|
| `Feed fetch failed` | URL unreachable or returns invalid content | Verify URL is accessible from hookshot. Check it returns valid RSS/Atom. |
| `Feed entries re-posted after restart` | No Redis cache configured | Configure `cache.redisUri` to persist feed state |
| `Display names resetting on upgrade` | Bot profile reset on restart | See [#1149](https://github.com/matrix-org/matrix-hookshot/issues/1149) |

## Where to get more help

1. Set `logging.level: debug` and reproduce the error
2. Search [GitHub issues](https://github.com/matrix-org/matrix-hookshot/issues) for the error message
3. Ask in [#hookshot:half-shot.uk](https://matrix.to/#/#hookshot:half-shot.uk) with logs and config (redact secrets)

## Related

- [Troubleshooting Index](index.md)
- [Webhooks Not Arriving](webhooks-not-arriving.md)
- [Authentication Issues](authentication.md)
- [Connection Issues](connection-issues.md)
