---
title: Component Model
description: Every runtime component in hookshot — what it does, what it owns, what depends on it
audience: [contributor, architect]
---

# Component Model

Hookshot is a single Node.js process (or [multiple workers](../guides/operator/workers-and-scaling.md)) with these major components:

```
┌─────────────────────────────────────────────────────────────┐
│                    BridgeApp (entry point)                   │
│                    src/App/BridgeApp.ts                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │ Bridge   │  │ Connection   │  │ ListenerService    │    │
│  │          │◄─┤ Manager      │  │ (HTTP listeners)   │    │
│  │ Event    │  │              │  │                    │    │
│  │ dispatch │  │ 15 Connection│  │ ┌──────────────┐  │    │
│  │          │  │ types        │  │ │ Webhooks.ts  │  │    │
│  └────┬─────┘  └──────────────┘  │ │ Express      │  │    │
│       │                          │ │ router       │  │    │
│  ┌────▼─────┐  ┌──────────────┐  │ └──────────────┘  │    │
│  │ Message  │  │ MatrixSender │  └────────────────────┘    │
│  │ Queue    │◄─┤              │                             │
│  │ LocalMQ  │  │ Send to HS   │  ┌────────────────────┐    │
│  │ or Redis │  └──────────────┘  │ BotUsersManager    │    │
│  └──────────┘                    │ (user identities)  │    │
│                                  └────────────────────┘    │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │ Storage  │  │ UserToken    │  │ BridgeWidgetApi    │    │
│  │ Provider │  │ Store        │  │ (REST + Widget)    │    │
│  │ Mem/Redis│  │ (encrypted)  │  └────────────────────┘    │
│  └──────────┘  └──────────────┘                             │
│                                  ┌────────────────────┐    │
│  ┌──────────┐  ┌──────────────┐  │ Rust NAPI modules  │    │
│  │ Feed     │  │ Hound        │  │ feeds, tokens,     │    │
│  │ Reader   │  │ Reader       │  │ format, permissions│    │
│  └──────────┘  └──────────────┘  └────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Components

### BridgeApp — Entry point

**File:** `src/App/BridgeApp.ts`
**Owns:** Startup sequence, dependency wiring
**Creates:** All other components

Initializes the system in [22 steps](../understand/event-lifecycle.md): listener → logging → appservice → storage → token store → Bridge → connections → feed polling → webhook routing → appservice start.

### Bridge — Event dispatch core

**File:** `src/Bridge.ts` (~2,100 lines)
**Owns:** Matrix event reception, [message queue](state-and-storage.md#message-queue) subscriptions, webhook handler bindings
**Depends on:** ConnectionManager, MessageQueue, MatrixSender, BotUsersManager

The central nervous system. Receives Matrix events via [appservice API](../reference/matrix-spec-map.md), receives webhook events via message queue, and dispatches both to the appropriate [connections](connections.md).

Binds [45+ handler functions](../understand/event-lifecycle.md#step-by-step) mapping message queue topics (e.g., `github.issues.opened`) to connection methods (e.g., `onIssueCreated`).

### ConnectionManager — Connection registry

**File:** `src/ConnectionManager.ts` (~924 lines)
**Owns:** Connection lifecycle, lookup, [provisioning](../reference/provisioning-api.md)
**Depends on:** All connection classes, StorageProvider, UserTokenStore

Maintains a flat array of all active [connections](connections.md). Provides lookup by room, service, and resource. Handles connection creation from all four [provisioning paths](../understand/integration-model.md#four-ways-to-create-a-connection).

### Connection types — Per-service logic

**Files:** `src/Connections/*.ts` (15 classes)
**Own:** Service-specific event handling, [bot commands](../reference/bot-commands.md), message formatting
**Depend on:** External service clients, MatrixSender

Each connection type implements `IConnection` and handles events for one service. See [Connections](connections.md) for the abstraction and [Integration Overview](../integrations/overview.md) for all types.

### ListenerService — HTTP server

**File:** `src/ListenerService.ts` (~141 lines)
**Owns:** Express HTTP listeners, port binding, [health probes](../guides/operator/monitoring.md#health-probes) (`/live`, `/ready`)
**Depends on:** Configuration

Manages multiple HTTP listeners, each binding a subset of resources (webhooks, widgets, metrics, provisioning). See [listener configuration](../guides/operator/configuration.md#listeners-required).

### Webhooks — Inbound routing

**File:** `src/Webhooks.ts` (~166 lines)
**Owns:** Express router, service-specific sub-routers
**Depends on:** MessageQueue, service routers

Routes incoming HTTP webhooks to the correct service router (`/github` → GitHubWebhooksRouter, `/gitlab` → GitLabWebhooksRouter, etc.). Each router verifies signatures and publishes events to the [message queue](state-and-storage.md#message-queue).

### MatrixSender — Outbound messages

**File:** `src/MatrixSender.ts` (~139 lines)
**Owns:** Matrix message delivery
**Depends on:** MessageQueue, Appservice (intents)

Listens on `matrix.message` queue topic. Sends events to the homeserver via bot [intents](../understand/glossary.md#matrix-concepts). Handles [encryption](../guides/operator/encryption.md) if configured.

### MessageQueue — Internal async routing

**Files:** `src/messageQueue/` (5 files)
**Owns:** Event routing between components
**Implementations:** [LocalMQ](state-and-storage.md#localmq-default) (in-process) or [RedisMQ](state-and-storage.md#redismq-worker-mode) (multi-worker)

### StorageProvider — Deduplication state

**Files:** `src/stores/` (3 files)
**Owns:** Tracking processed events to prevent duplicates
**Implementations:** [MemoryStorageProvider or RedisStorageProvider](state-and-storage.md#storage-providers)

### UserTokenStore — Credential management

**Owns:** OAuth tokens, personal access tokens, encrypted storage
**Depends on:** `passFile` RSA key (Rust [token encryption](../understand/trust-and-boundaries.md#token-store))

### BotUsersManager — User identities

**File:** `src/managers/BotUsersManager.ts`
**Owns:** Bot user registration, room membership, [service bots](../guides/operator/service-bots.md)
**Depends on:** Appservice

### BridgeWidgetApi — REST API + Widget

**File:** `src/widgets/BridgeWidgetApi.ts`
**Owns:** [Provisioning API](../reference/provisioning-api.md) endpoints, widget frontend serving
**Depends on:** ConnectionManager, UserTokenStore

### FeedReader / HoundReader — Polling services

**Owns:** Periodic polling for [RSS/Atom feeds](../integrations/feeds.md) and [ChallengeHound](../integrations/challengehound.md)
**Depends on:** Rust feed parser (NAPI), MessageQueue

### Rust NAPI modules

**Files:** `src/*.rs`, `src/**/*.rs`
**Owns:** Performance-critical operations

| Module | Purpose |
|---|---|
| `feeds/parser.rs` | RSS/Atom feed parsing |
| `tokens/mod.rs` | Token encryption/decryption |
| `format_util.rs` | Message formatting, HTML sanitization |
| `config/permissions.rs` | [Permission checking](../understand/trust-and-boundaries.md#permission-system) |
| `github/types.rs` | GitHub type utilities |
| `jira/types.rs`, `jira/utils.rs` | JIRA utilities |

See [Connections: Rust boundary](connections.md#adding-a-new-connection-type) for the NAPI interface pattern.

## Startup sequence

See [Event Lifecycle](../understand/event-lifecycle.md) for the full 22-step startup. Key dependency order:

```
Storage → Queue → Homeserver check → BotUsers → GitHub/Figma init
→ ConnectionManager → Event handlers → Room processing (concurrency: 2)
→ Widget API → Metrics → FeedReader → Webhooks → Appservice.begin()
```

## Related

**Concepts:** [Event Lifecycle](../understand/event-lifecycle.md) · [Integration Model](../understand/integration-model.md) · [Trust and Boundaries](../understand/trust-and-boundaries.md)

**Architecture:** [Connections](connections.md) · [State and Storage](state-and-storage.md)

**Reference:** [Provisioning API](../reference/provisioning-api.md) · [Bot Commands](../reference/bot-commands.md) · [Matrix Spec Map](../reference/matrix-spec-map.md)

**Operator:** [Configuration](../guides/operator/configuration.md) · [Workers](../guides/operator/workers-and-scaling.md) · [Monitoring](../guides/operator/monitoring.md)
