---
title: Glossary
description: Definitions of key terms used in hookshot documentation
audience: [evaluator, user, operator, developer, contributor, architect]
---

# Glossary

## Hookshot concepts

**Connection**
A binding between a Matrix room and an external resource. Stored as a Matrix room state event. Examples: a GitHub repo connection, a generic webhook, an RSS feed subscription. See [Integration Model](integration-model.md).

**Connection type**
A class that implements the Connection interface for a specific service. Hookshot has 15 connection types across 8 services. Examples: `GitHubRepoConnection`, `GenericHookConnection`, `FeedConnection`.

**Inbound event**
An event originating from an external service (webhook, feed update) that hookshot delivers as a Matrix message.

**Outbound command**
A bot command sent by a user in a Matrix room that hookshot executes as an action on an external service. Example: `!gh create "Bug title"`.

**Transformation function**
User-supplied JavaScript code that transforms a generic webhook payload into a custom Matrix message. Runs in a QuickJS sandbox with a 500ms timeout.

**Hook / Webhook**
An HTTP endpoint that receives POST requests from external services. Each hookshot integration has its own webhook path (e.g., `/github/webhook`, `/webhook/{hookId}`).

**Outbound hook**
A connection that forwards Matrix room messages to an external HTTP endpoint (the reverse of a regular webhook).

**Service bot**
A Matrix user identity that hookshot uses to send messages. The default bot is `@hookshot:domain`. Additional service-specific bots can be configured (e.g., a dedicated GitHub bot).

## Matrix concepts

**Application service (appservice)**
A privileged service that registers with a Matrix homeserver. Hookshot is an appservice. Appservices can impersonate users, receive all events in rooms they join, and reserve user ID namespaces. See [Matrix Spec](https://spec.matrix.org/latest/application-service-api/).

**Homeserver**
The Matrix server that stores rooms, events, and user accounts. Examples: Synapse, Dendrite, Conduit. Hookshot connects to a homeserver via the appservice API.

**Room state event**
A Matrix event with a `type` and `state_key` that represents persistent configuration in a room. Hookshot uses custom state event types (e.g., `uk.half-shot.matrix-hookshot.github.repository`) to store connection configuration. See [Matrix Spec](https://spec.matrix.org/latest/client-server-api/#room-state).

**Intent**
A Matrix SDK concept. An intent represents a virtual user that the appservice can act as. Hookshot uses intents to send messages as bot users.

**m.room.message**
The standard Matrix event type for messages. Hookshot sends notifications as `m.room.message` events with `msgtype: m.notice` (to distinguish bot messages from human messages).

**m.notice**
A message type indicating a bot/automated message. Matrix clients typically render these differently (e.g., gray text in Element).

## Infrastructure concepts

**Bridge**
In Matrix terminology, a bridge connects Matrix to another communication platform. Hookshot is technically an appservice that acts as a bridge to multiple services.

**NAPI / NAPI-rs**
Node.js API for native addons. Hookshot uses NAPI-rs to call Rust code from TypeScript for performance-critical operations (feed parsing, token encryption, permission checking).

**QuickJS**
A small JavaScript engine used as a sandbox for running user-supplied transformation functions. Isolated from the Node.js process — no network, filesystem, or module access.

**Message queue**
Hookshot's internal async event delivery system. Webhook events are placed on the queue and processed by Bridge.ts subscribers. Supports in-process delivery or Redis-backed queue for multi-worker setups.

**Widget**
A Matrix feature that allows embedding web UIs inside Matrix clients. Hookshot provides a widget for configuring connections without bot commands.

**Provisioning API**
Hookshot's REST API for managing connections programmatically. Available at `/widgetapi/v1/`. Used by the widget UI and available to external tools.

## Related

- [What is Hookshot](what-is-hookshot.md) — System overview
- [Event Lifecycle](event-lifecycle.md) — How events flow
- [Integration Model](integration-model.md) — The Connection pattern
- [Architecture: Connections](../architecture/connections.md) — Deep dive
