---
title: Event Lifecycle
description: How events flow through hookshot — from external services to Matrix rooms and back
audience: [evaluator, developer, operator, contributor, architect]
---

# Event Lifecycle

Hookshot processes events in two directions. Inbound: an external service sends a webhook, hookshot transforms it and delivers a Matrix message. Outbound: a user sends a command in a Matrix room, hookshot executes an action on an external service.

Understanding these two flows explains most of hookshot's behavior.

## Inbound: External Service to Matrix

An external event (GitHub PR opened, GitLab MR merged, JIRA ticket created) becomes a Matrix message through this pipeline:

```mermaid
sequenceDiagram
    participant EXT as External Service
    participant LIS as ListenerService
    participant WH as Webhooks.ts<br/>(Express router)
    participant SVC as Service Router<br/>(e.g. GitHubWebhooksRouter)
    participant MQ as MessageQueue
    participant BR as Bridge.ts
    participant CM as ConnectionManager
    participant CONN as Connection
    participant MS as MatrixSender
    participant HS as Homeserver

    EXT->>LIS: POST /{service}/webhook
    LIS->>WH: Route by path prefix
    WH->>SVC: Delegate to service router
    SVC->>SVC: Verify signature/secret
    SVC->>MQ: emit("{service}.{event}.{action}", payload)
    MQ->>BR: Deliver to subscriber
    BR->>CM: Find connections for this event
    CM-->>BR: [matching Connection instances]
    BR->>CONN: Call handler (e.g. onIssueCreated)
    CONN->>CONN: Check if event type is enabled
    CONN->>CONN: Format message (emoji, markdown, metadata)
    CONN->>MS: sendMatrixMessage(roomId, content)
    MS->>HS: PUT /_matrix/client/v3/rooms/{roomId}/send/m.room.message
```

<!-- Code: src/Webhooks.ts:17-166, src/Bridge.ts:299-1023, src/MatrixSender.ts:53-91 -->

### Step by step

**1. HTTP reception** — External services POST webhooks to hookshot's HTTP listener. Each service has a dedicated path:

| Path | Service | Router |
|---|---|---|
| `/github/webhook` | GitHub | GitHubWebhooksRouter |
| `/gitlab` | GitLab | GitLabWebhooksRouter |
| `/jira/events` | JIRA | JiraWebhooksRouter |
| `/figma/webhook` | Figma | FigmaWebhooksRouter |
| `/webhook/{hookId}` | Generic webhooks | GenericWebhooksRouter |
| `/openproject` | OpenProject | OpenProjectWebhooksRouter |

<!-- Code: src/Webhooks.ts:68-100 -->

**2. Signature verification** — Each service router verifies the webhook is authentic. GitHub uses HMAC-SHA256 via `x-hub-signature-256`. GitLab uses a secret token header. JIRA and others have their own mechanisms.

<!-- Code: src/github/Router.ts:74-99 -->

**3. Message queue** — The verified payload is emitted to the internal message queue with a topic name following the pattern `{service}.{event}.{action}`. Examples: `github.issues.opened`, `gitlab.merge_request.close`, `jira.issue_created`.

**4. Bridge dispatch** — `Bridge.ts` subscribes to all service topics. For each topic, a `bindHandlerToQueue` call defines: which connection type handles it, how to find the right connection instances, and which method to call.

There are **45+ handler bindings** across all services:
- GitHub: 15 bindings (issues, PRs, pushes, releases, workflows, discussions)
- GitLab: 12 bindings (merge requests, issues, pushes, tags, wiki, releases, notes)
- JIRA: 5 bindings (issues, versions)
- Figma: 1 binding (comments)
- Feeds: 3 bindings (entry, success, error)
- OpenProject: 2 bindings (work package created, updated)
- ChallengeHound: 1 binding (activity)
- Generic webhooks: 1 binding

<!-- Code: src/Bridge.ts:299-1023 — full handler binding list -->

**5. Connection lookup** — ConnectionManager finds all Connection instances interested in this event. For GitHub, this means finding all `GitHubRepoConnection` instances connected to the repository that generated the event.

**6. Handler execution** — The connection's handler method runs. It checks if the specific event type is enabled (e.g., the user may have disabled `push` events), formats the message with appropriate emoji and metadata, and sends it.

**7. Matrix delivery** — `MatrixSender` delivers the message to the Matrix room via the homeserver's client-server API. Messages are sent as `m.room.message` events with `msgtype: m.notice`.

### Event filtering

Not all events reach Matrix. Each connection instance has an `enableHooks` list that controls which event types produce messages. For example, a GitHub repo connection defaults to 13 of 23 possible event types.

<!-- Code: src/Connections/GithubRepo.ts:205-218 (default enabled events) -->

### Message format

All hookshot messages share a common structure:

```json
{
  "msgtype": "m.notice",
  "body": "plain text version",
  "formatted_body": "<html version>",
  "format": "org.matrix.custom.html",
  "external_url": "https://link-to-source",
  "uk.half-shot.matrix-hookshot.{service}.{entity}": {
    "metadata": "about the source event"
  }
}
```

The `uk.half-shot.matrix-hookshot.*` fields carry structured metadata about the source event (repo, issue, PR, etc.). This enables Matrix clients to build rich displays.

<!-- Code: src/FormatUtil.ts:60-134 -->

## Outbound: Matrix to External Service

A user sends a bot command in a Matrix room. Hookshot parses it, finds the right connection, and executes an action on the external service.

```mermaid
sequenceDiagram
    participant U as User
    participant HS as Homeserver
    participant BR as Bridge.ts
    participant CMD as BotCommands
    participant CONN as Connection
    participant EXT as External Service

    U->>HS: Send message: "!gh create 'Bug title'"
    HS->>BR: room.message event (appservice API)
    BR->>CMD: Parse command prefix
    CMD->>CONN: Dispatch to GitHubRepoConnection
    CONN->>EXT: octokit.issues.create(...)
    EXT-->>CONN: Issue #42 created
    CONN->>HS: Send confirmation: "Created issue #42"
```

<!-- Code: src/Bridge.ts:1338 (onRoomMessage), src/BotCommands.ts:199 (handleCommand) -->

### Step by step

**1. Matrix event** — The homeserver delivers the room message to hookshot via the appservice transaction API.

**2. Command parsing** — `Bridge.onRoomMessage` finds connections in the room. Each connection type defines a command prefix (e.g., `!gh` for GitHub, `!gl` for GitLab, `!jira` for JIRA). The `BotCommands` system matches the message prefix and dispatches to the correct handler.

**3. Permission check** — Before executing, hookshot checks if the user has permission for this action via the `BridgePermissions` system.

<!-- Code: src/config/permissions.rs (Rust NAPI module) -->

**4. External API call** — The connection calls the external service API (Octokit for GitHub, axios for GitLab, etc.) using the appropriate credentials.

**5. Confirmation** — The connection sends a response message back to the Matrix room confirming the action.

### Available commands by service

| Service | Prefix | Commands |
|---|---|---|
| GitHub | `!gh` | `create`, `close`, `assign`, `workflow run` |
| GitLab | `!gl` | `create`, `create-confidential`, `close` |
| JIRA | `!jira` | `create`, `issue-types`, `assign` |
| OpenProject | `!op` | `create`, `close`, `priority`, `assign`, `responsible` |
| Setup | `!hookshot` | `github repo`, `gitlab project`, `jira project`, `webhook`, `feed`, ... |

<!-- Code: @botCommand decorators across src/Connections/*.ts and src/AdminRoom.ts -->

## Emoji reactions

A special outbound flow: hookshot maps Matrix emoji reactions to actions on external services. This is currently implemented for GitHub.

| Emoji | Action |
|---|---|
| :thumbsup: :thumbsdown: :laugh: :tada: :heart: :rocket: :eyes: | Add GitHub reaction |
| :wastebasket: | Close issue |
| :raised_hand: | Reopen issue |
| :white_check_mark: | Approve PR |
| :x: :no_entry_sign: | Request changes on PR |

<!-- Code: src/Connections/GithubRepo.ts reaction handlers -->

## Feed polling (special case)

RSS/Atom feeds don't use webhooks. Instead, hookshot polls feeds on an interval using a Rust-based feed parser. New entries produce `feed.entry` events on the message queue, which follow the same Connection handler path as webhook events.

<!-- Code: src/feeds/parser.rs (Rust), src/Connections/FeedConnection.ts:244-284 -->

## Failure behavior

| Failure | System behavior |
|---|---|
| Webhook signature invalid | HTTP 401 returned, no event processed |
| Connection not found for event | Event silently dropped (logged at debug level) |
| Event type disabled on connection | Event silently dropped |
| External API call fails (outbound) | Error message sent to Matrix room |
| Matrix message send fails | Error logged, message queue handles retry |
| Homeserver unreachable | Messages queued, retried when connection restored |

<!-- Assumption — retry behavior needs verification against MessageQueue implementation -->

## Related

- [Integration Model](integration-model.md) — The Connection abstraction
- [Architecture: Message Pipeline](../architecture/message-pipeline.md) — Deep dive into message processing
- [Architecture: Connections](../architecture/connections.md) — Connection lifecycle and state
- [Matrix Spec: Application Service API](https://spec.matrix.org/latest/application-service-api/) — How hookshot receives Matrix events
