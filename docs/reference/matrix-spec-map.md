---
title: Matrix Spec Map
description: How hookshot maps to the Matrix specification
audience: [developer, architect, contributor]
---

# Matrix Specification Map

How hookshot uses the Matrix specification. This page maps hookshot concepts to the relevant spec sections.

## Core spec dependencies

| Hookshot feature | Matrix spec section | How hookshot uses it |
|---|---|---|
| Appservice registration | [Application Service API](https://spec.matrix.org/latest/application-service-api/) | Hookshot registers as an appservice to receive events and act as bot users |
| Bot messages | [m.room.message](https://spec.matrix.org/latest/client-server-api/#mroommessage) | All notifications sent as `m.room.message` with `msgtype: m.notice` |
| Connection storage | [Room State Events](https://spec.matrix.org/latest/client-server-api/#room-state) | [Connections](../architecture/connections.md) stored as custom state events (`uk.half-shot.matrix-hookshot.*`) |
| Room upgrades | [m.room.tombstone](https://spec.matrix.org/latest/client-server-api/#mroomtombstone) | Hookshot [migrates connections](../architecture/connections.md#room-migration) when rooms are upgraded |
| Power levels | [m.room.power_levels](https://spec.matrix.org/latest/client-server-api/#mroompower_levels) | Hookshot checks power levels before writing state events |
| Room membership | [m.room.member](https://spec.matrix.org/latest/client-server-api/#mroommember) | Bot auto-joins on invite, caches membership for [permissions](../understand/trust-and-boundaries.md#permission-system) |
| Formatted messages | [org.matrix.custom.html](https://spec.matrix.org/latest/client-server-api/#mroommessage-msgtypes) | All notifications include `formatted_body` with HTML |
| User impersonation | [Appservice identity assertion](https://spec.matrix.org/latest/application-service-api/#identity-assertion) | [Service bots](../guides/operator/service-bots.md) send messages as virtual users |
| Encryption | [E2EE / Megolm](https://spec.matrix.org/latest/client-server-api/#end-to-end-encryption) | Optional [encryption support](../guides/operator/encryption.md) for E2EE rooms |

## Unstable/experimental specs

| MSC | Status | Hookshot usage |
|---|---|---|
| [MSC2409](https://github.com/matrix-org/matrix-spec-proposals/pull/2409) | Implemented in Synapse | Push ephemeral events to appservices (required for [encryption](../guides/operator/encryption.md)) |
| [MSC3202](https://github.com/matrix-org/matrix-spec-proposals/pull/3202) | Implemented in Synapse | Device masquerading for appservice encryption |
| [MSC4203](https://github.com/matrix-org/matrix-spec-proposals/pull/4203) | Draft | Improved appservice encryption |

## Matrix event types hookshot sends

| Event type | Where | Purpose |
|---|---|---|
| `m.room.message` (msgtype: `m.notice`) | Rooms | All notifications and command responses |
| `m.room.message` (msgtype: `m.text`) | Rooms | Some user-facing responses |
| `m.reaction` | Rooms | Response to [emoji reaction commands](../integrations/github.md#emoji-reactions) |
| Custom state events (`uk.half-shot.matrix-hookshot.*`) | Room state | [Connection configuration](../reference/event-types.md) |

## Matrix event types hookshot consumes

| Event type | Handler | Purpose |
|---|---|---|
| `m.room.message` | [Bridge.onRoomMessage](../understand/event-lifecycle.md#outbound-matrix-to-external-service) | Bot command dispatch |
| `m.room.member` | Bridge.onRoomEvent | Membership cache for [permissions](../understand/trust-and-boundaries.md#permission-system) |
| `m.room.tombstone` | Bridge.onRoomEvent | [Room upgrade migration](../architecture/connections.md#room-migration) |
| `m.room.power_levels` | Bridge.onRoomEvent | Power level tracking |
| Custom state events | [ConnectionManager](../architecture/connections.md#connectionmanager) | Connection creation and updates |
| `m.reaction` | Connection handlers | [Emoji reaction dispatch](../integrations/github.md#emoji-reactions) |

## Appservice registration

Hookshot's [registration file](../guides/operator/installation.md#create-the-registration-file) declares:

| Field | Value | Spec reference |
|---|---|---|
| `sender_localpart` | `hookshot` | [Appservice registration](https://spec.matrix.org/latest/application-service-api/#registration) |
| `namespaces.users` | `@_github_.*`, `@_gitlab_.*`, `@_jira_.*`, `@_webhooks_.*` | [User namespace](https://spec.matrix.org/latest/application-service-api/#registration) |
| `namespaces.aliases` | `#github_.+:domain` | [Alias namespace](https://spec.matrix.org/latest/application-service-api/#registration) |
| `rate_limited` | `false` | Appservice requests are not rate limited |

See [Installation: Create the registration file](../guides/operator/installation.md#create-the-registration-file) for the full template.

## Custom event types

Hookshot defines 15+ custom state event types for [connection storage](../reference/event-types.md). These are not part of the Matrix spec — they use the `uk.half-shot.matrix-hookshot.` namespace (with one exception: `org.matrix.matrix-hookshot.openproject.*`).

Full list: [Reference: Event Types](../reference/event-types.md)

## Message metadata

Hookshot embeds structured metadata in `m.room.message` events using custom fields (e.g., `uk.half-shot.matrix-hookshot.github.repo`). These enable rich client rendering but are not part of the Matrix spec.

Full list: [Reference: Event Types — Message metadata](../reference/event-types.md#message-metadata-event-types)

## Related

- [What is Hookshot](../understand/what-is-hookshot.md) — System overview
- [Event Lifecycle](../understand/event-lifecycle.md) — How events flow
- [Architecture: Connections](../architecture/connections.md) — Connection state model
- [Reference: Event Types](../reference/event-types.md) — All custom event types
- [Installation](../guides/operator/installation.md) — Registration file setup
- [Encryption](../guides/operator/encryption.md) — E2EE configuration
