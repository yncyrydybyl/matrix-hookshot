---
title: Failure and Recovery
description: What happens when things break — failure modes, retry behavior, and recovery
audience: [operator, contributor, architect]
---

# Failure and Recovery

What happens when external services go down, the homeserver is unreachable, or hookshot crashes. Understanding failure behavior helps operators set up [monitoring](../guides/operator/monitoring.md) and plan recovery.

## Failure scenarios

| Failure | System behavior | Recovery | Detection |
|---|---|---|---|
| **External service down** | Outbound [commands](../reference/bot-commands.md) fail with error message in room. Inbound webhooks stop arriving (external side). | Automatic when service recovers. No hookshot restart needed. | `hookshot_connection_event_failed` metric, error messages in rooms |
| **Homeserver unreachable** | On startup: retries every 5s until connected. At runtime: message sends fail, queued for retry. | Automatic reconnection. Messages may be lost if queue is in-memory ([LocalMQ](state-and-storage.md#localmq-default)). | `matrix_api_calls_failed` metric, startup logs |
| **Webhook signature mismatch** | HTTP 401 returned, event silently dropped. | Fix secret in [config](../guides/operator/configuration.md) or external service settings. | Logs at warn level, `hookshot_webhooks_http_request` without corresponding `hookshot_queue_event_pushes` |
| **Connection not found** | Event arrives but no matching [connection](connections.md). Silently dropped. | Create connection in the room, or check [event types](../reference/event-types.md) match. | Debug-level logs only |
| **Event type disabled** | Connection exists but this event type isn't in `enableHooks`. Silently dropped. | Update connection config to enable the event type. | Not logged — by design |
| **Transformation function error** | [Generic webhook](../integrations/generic-webhooks.md) transformation throws or times out. No message sent. | Fix transformation function. Test with simpler input. | `hookshot_connection_event_failed` metric, warn-level logs |
| **Matrix message too large** | Message exceeds ~65KB event limit. Trimmed automatically. | Reduce payload size or transformation output. | Warn-level log |
| **Redis down** | [RedisMQ](state-and-storage.md#redismq-worker-mode): all event routing stops. [RedisStorage](state-and-storage.md#redisstorageprovider): dedup stops, feeds may re-post. | Restart Redis. Hookshot auto-reconnects. | Queue metrics flat, connection errors in logs |
| **Hookshot crash/restart** | All [connections](connections.md) reconstructed from [room state](state-and-storage.md#matrix-room-state-as-primary-store). In-flight events lost. Feed state lost without Redis. | Automatic on restart. [Feed](../integrations/feeds.md) entries may re-post without Redis. | Process monitoring, `/ready` [health probe](../guides/operator/monitoring.md#health-probes) |
| **Token store corrupted** | [OAuth tokens](../understand/trust-and-boundaries.md#token-store) unreadable. Users appear unauthenticated. | Users re-authenticate. If `passFile` is lost, all tokens must be recreated. | [Authentication errors](../troubleshooting/authentication.md#check-5-is-the-token-store-working) |
| **Encryption state corrupted** | [E2EE](../guides/operator/encryption.md) messages fail. | Reset crypto store: `yarn start:resetcrypto`. | Decryption failure metrics, [encryption troubleshooting](../troubleshooting/common-errors.md#startup-errors) |

## Startup resilience

Hookshot's startup sequence handles failures at each stage:

1. **Homeserver connection** — retries every 5 seconds indefinitely until reachable
2. **Room state loading** — processes rooms with concurrency of 2; one failing room doesn't block others
3. **Connection reconstruction** — invalid state events are logged and skipped, not fatal
4. **Service initialization** — GitHub/Figma webhook setup failures are logged but don't prevent startup

<!-- Code: src/Bridge.ts:169-180 (homeserver retry), :1024-1115 (room processing) -->

## Message delivery guarantees

| Path | Guarantee | Risk |
|---|---|---|
| Inbound webhook → Matrix message | At-most-once (LocalMQ) | Event lost if hookshot crashes mid-processing |
| Inbound webhook → Matrix message | At-most-once (RedisMQ) | Event lost if consumer crashes after dequeue |
| Outbound command → external API | At-most-once | Command fails if external API is unreachable |
| Feed polling → Matrix message | At-least-once with Redis | Entry may re-post if Redis state is lost |
| Feed polling → Matrix message | At-least-once without Redis | Re-posts all entries after restart |

Hookshot does **not** provide exactly-once delivery. Duplicate messages are possible in edge cases (feed re-polling, webhook retries from external services).

## Feed polling resilience

[Feed connections](../integrations/feeds.md) have built-in error handling:

- **Retry on send failure:** 5 attempts with 5-second intervals
- **Error tracking:** Last 5 poll results stored (timestamp, success/error)
- **Optional error notification:** `notifyOnFailure: true` sends a message when polling fails
- **Backoff:** Under load, polling interval may increase (never decreases below configured interval)
- **Deduplication:** MD5 hash of entry GUID prevents re-posting seen entries (requires [Redis](state-and-storage.md#redisstorageprovider) for persistence)

<!-- Code: src/Connections/FeedConnection.ts:276-283 (retry), :295-319 (error handling) -->

## What to monitor

Set up [Prometheus alerts](../guides/operator/monitoring.md#alert-suggestions) for:

| Metric | Alert condition | Meaning |
|---|---|---|
| `matrix_api_calls_failed` | Increasing | Homeserver communication failing |
| `hookshot_connection_event_failed` | Increasing | Events failing to process |
| `hookshot_queue_event_pushes` | Flat for >1h | No webhook traffic (may be expected) |
| `hookshot_feeds_failing` | > 0 | Feeds failing to fetch |
| Process health | `/ready` returns non-200 | Hookshot not fully initialized |

## Recovery procedures

### After hookshot restart
No action needed. Connections are automatically reconstructed from [room state](state-and-storage.md#startup-reconstruction). Check logs for `Bridge has started`.

### After Redis outage
Redis auto-reconnects. Feed state may be stale — some entries may re-post. No manual action needed.

### After homeserver database reset
If the homeserver's database is wiped:
1. All room state (connections) is lost
2. Hookshot's [crypto store](../guides/operator/encryption.md#crypto-store) must be reset: `yarn start:resetcrypto`
3. Users must re-create connections and re-authenticate

### After passkey loss
If `passFile` is lost or changed:
1. All stored OAuth tokens become unreadable
2. Users must re-authenticate with each service
3. Generate a new passkey and [back it up](../guides/operator/hardening.md#credential-protection)

## Related

**Concepts:** [Event Lifecycle](../understand/event-lifecycle.md) · [Trust and Boundaries](../understand/trust-and-boundaries.md)

**Architecture:** [Connections](connections.md) · [State and Storage](state-and-storage.md) · [Component Model](component-model.md)

**Operator:** [Monitoring](../guides/operator/monitoring.md) · [Upgrading](../guides/operator/upgrading.md) · [Encryption](../guides/operator/encryption.md) · [Hardening](../guides/operator/hardening.md)

**Troubleshooting:** [Common Errors](../troubleshooting/common-errors.md) · [Webhooks Not Arriving](../troubleshooting/webhooks-not-arriving.md) · [Authentication](../troubleshooting/authentication.md)
