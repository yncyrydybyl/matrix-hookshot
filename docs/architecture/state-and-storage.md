---
title: State and Storage
description: How hookshot persists data — Matrix room state, Redis cache, and the encrypted token store
audience: [contributor, architect, operator]
---

# State and Storage

Hookshot uses three storage mechanisms, each for different data:

| Storage | Data | Persistence | Required |
|---|---|---|---|
| Matrix room state | [Connection](connections.md) configuration | Permanent (homeserver) | Yes |
| Token store | OAuth tokens, credentials | Encrypted file on disk | Yes |
| Redis | Feed state, caches, message queue | External service | Optional |

No traditional database (PostgreSQL, SQLite) is needed.

## Matrix room state as primary store

[Connections](connections.md) are stored as Matrix [room state events](../reference/event-types.md). This is hookshot's most distinctive architectural choice.

Each connection = one state event:
- **Type:** `uk.half-shot.matrix-hookshot.{service}.{entity}` (see [full list](../reference/event-types.md))
- **State key:** identifies the resource (e.g., `my-org/my-repo`)
- **Content:** connection configuration (hooks, options, auth context)

### Startup reconstruction

On startup, hookshot reads state from every room the bot is in and reconstructs connections:

```
for each room in joinedRooms:          // Bridge.ts:1024
  loadStateEvents(room)                // ConnectionManager.createConnectionsForRoomId
  for each uk.half-shot.* event:
    createConnection(event)            // Instantiate connection class
    registerWithManager()              // Add to ConnectionManager.connections[]
```

Processing runs with **concurrency of 2** — two rooms processed simultaneously.

<!-- Code: src/Bridge.ts:1024-1115 -->

### Legacy state events

Hookshot supports two generations of state event types:
- **Current:** `uk.half-shot.matrix-hookshot.*`
- **Legacy:** `uk.half-shot.matrix-github.*`

On startup, legacy events are recognized and connections are created from them. See [Event Types: Legacy](../reference/event-types.md#legacy-event-types).

### Trade-offs

| Advantage | Disadvantage |
|---|---|
| No external database to manage | No ad-hoc queries across rooms |
| State travels with rooms (upgrades, federation) | Startup must scan all rooms |
| Configuration visible in room settings | State event size limit (~65KB) |
| Natural access control (room membership = access) | No global connection inventory |

## Storage providers

Hookshot has two storage provider implementations for tracking processed events (deduplication):

### MemoryStorageProvider

In-process storage using Maps and LRU caches. Default when Redis is not configured.

**Stores:** processed GitHub issues, comments, PR reviews, Figma comment IDs, GitLab discussion threads, feed GUIDs, ChallengeHound activity IDs, webhook warnings, OpenProject work package state.

**Limitation:** All data lost on restart. Feeds will re-post entries. Issue deduplication resets.

<!-- Code: src/stores/MemoryStorageProvider.ts -->

### RedisStorageProvider

Redis-backed storage with configurable expiration.

```yaml
cache:
  redisUri: "redis://localhost:6379"
```

**Expiration times:**
| Data | TTL |
|---|---|
| GitHub issues | 7 days |
| Completed transactions | 24 hours |
| Stored files | 24 hours |
| ChallengeHound events | 90 days |

**Required for:** [Feed persistence](../integrations/feeds.md) across restarts, [encryption](../guides/operator/encryption.md).

<!-- Code: src/stores/RedisStorageProvider.ts -->

### Interface

Both implement `IBridgeStorageProvider`:

```typescript
interface IBridgeStorageProvider {
  // GitHub
  getGithubIssue(repo, issue, author?): Promise<boolean>;
  setGithubIssue(repo, issue, author?): Promise<void>;
  
  // Feeds
  hasSeenFeed(url): Promise<boolean>;
  hasSeenFeedGuids(url, ...guids): Promise<string[]>;
  setSeenFeedGuids(url, ...guids): Promise<void>;
  
  // Figma, GitLab, Hound, OpenProject...
  // Similar get/set patterns for each service
  
  connect?(): Promise<void>;
  disconnect?(): Promise<void>;
}
```

<!-- Code: src/stores/StorageProvider.ts:15-107 -->

## Message queue

The message queue routes webhook events from listeners to connection handlers. Two implementations:

### LocalMQ (default)

In-process event routing using Node.js `EventEmitter` with glob-pattern subscriptions (via `micromatch`).

- Topics: `github.issues.opened`, `gitlab.merge_request.close`, etc.
- Subscriptions: `github.*`, `gitlab.*`, `jira.*`, etc.
- Request-response pattern for `pushWait` (30s default timeout)
- No persistence — events are lost if the process crashes mid-handling

<!-- Code: src/messageQueue/LocalMQ.ts -->

### RedisMQ (worker mode)

Redis pub/sub for multi-process communication. Required for [worker mode](../guides/operator/workers-and-scaling.md).

```yaml
queue:
  redisUri: "redis://localhost:6379"
```

- Uses Redis pattern subscriptions (`PSUBSCRIBE`)
- Consumer tracking via Redis sets (prefix: `consumers.`)
- Single-recipient routing: selects random consumer from tracked set
- Three Redis connections per instance (subscribe, publish, general)

<!-- Code: src/messageQueue/RedisQueue.ts -->

### Factory

```typescript
createMessageQueue(config?) 
// No config → LocalMQ
// Config with redisUri → RedisMQ (singleton)
```

<!-- Code: src/messageQueue/index.ts:6-16 -->

## Token store

User OAuth tokens and credentials are stored in an encrypted file.

- **Encryption:** RSA key from `passFile` config (see [Trust and Boundaries](../understand/trust-and-boundaries.md#token-store))
- **Implementation:** Rust NAPI module (`src/tokens/mod.rs`)
- **Contains:** GitHub OAuth/PAT tokens, JIRA tokens, GitLab tokens, OpenProject tokens

If `passFile` changes, all tokens become unreadable. Users must re-authenticate. See [Authentication troubleshooting](../troubleshooting/authentication.md#check-5-is-the-token-store-working).

## Data flow summary

```
External webhook → MessageQueue → Connection handler
                                       │
                     ┌─────────────────┤
                     ▼                 ▼
              StorageProvider    MatrixSender
              (dedup check)     (send to room)
                     │                 │
                     ▼                 ▼
              Redis / Memory    Matrix Homeserver
                                       │
                                       ▼
                               Room State Events
                               (connection config)
```

## Related

**Concepts:** [Integration Model](../understand/integration-model.md) · [Event Lifecycle](../understand/event-lifecycle.md) · [Trust and Boundaries](../understand/trust-and-boundaries.md#token-store)

**Architecture:** [Connections](connections.md) — What's stored in state events

**Reference:** [Event Types](../reference/event-types.md) — All state event types · [Matrix Spec Map](../reference/matrix-spec-map.md)

**Operator:** [Configuration: Cache](../guides/operator/configuration.md#cache-optional) · [Workers](../guides/operator/workers-and-scaling.md) · [Encryption](../guides/operator/encryption.md) · [Upgrading](../guides/operator/upgrading.md#what-persists-across-upgrades)

**Troubleshooting:** [Common Errors](../troubleshooting/common-errors.md#feed-errors) — Feed re-posting after restart

**Matrix Spec:** [Room State Events](https://spec.matrix.org/latest/client-server-api/#room-state)
