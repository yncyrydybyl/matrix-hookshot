---
title: Integration Overview
description: All hookshot integrations and their capabilities at a glance
audience: [evaluator, user, operator, developer, architect]
---

# Integration Overview

Hookshot connects Matrix rooms to external services through **connections** — bidirectional bindings stored as Matrix room state events. Each connection type handles events from one external service and optionally accepts commands from Matrix.

## Capability Matrix

| Integration | Inbound events | Outbound commands | OAuth | Webhooks | Bot commands | Widget UI | Provisioning API |
|---|---|---|---|---|---|---|---|
| [GitHub](#github) | 23 event types | Create, close, assign issues; trigger workflows | Yes (GitHub App + user OAuth) | Yes | `!gh` | Yes | Yes |
| [GitLab](#gitlab) | 12 event types | Create, close issues | Yes (token-based) | Yes | `!gl` | Yes | Yes |
| [JIRA](#jira) | 5 event types | Create, assign issues | Yes (Cloud: OAuth 2.0, Server: OAuth 1.0) | Yes | `!jira` | Yes | Yes |
| [Generic Webhooks](#generic-webhooks) | Any JSON/form/XML payload | Outbound hooks (separate connection) | No | Yes | Via `!hookshot webhook` | Yes | Yes |
| [RSS/Atom Feeds](#feeds) | New feed entries | None | No | No (polling) | Via `!hookshot feed` | Yes | Yes |
| [Figma](#figma) | File comments | None | No | Yes | Via `!hookshot figma file` | Yes | Yes |
| [OpenProject](#openproject) | Work packages created/updated | Create, close, assign, set priority | Yes (OAuth 2.0) | Yes | `!op` | Yes | Yes |
| [ChallengeHound](#challengehound) | Activities | None | No | No (polling) | Via `!hookshot challenghound` | Yes | Yes |

> **Source:** [`src/Connections/`](https://github.com/matrix-org/matrix-hookshot/blob/main/src/Connections/)

## Connection types per service

Some services have multiple connection types for different use cases.

| Service | Connection type | State event | Purpose |
|---|---|---|---|
| **GitHub** | GitHubRepoConnection | `uk.half-shot.matrix-hookshot.github.repository` | Monitor repo events, run commands |
| | GitHubIssueConnection | `uk.half-shot.matrix-hookshot.github.issue` | Bridge a single issue to a room |
| | GitHubDiscussionConnection | `uk.half-shot.matrix-hookshot.github.discussion` | Bridge a discussion thread |
| | GitHubDiscussionSpace | `uk.half-shot.matrix-hookshot.github.discussion.space` | Space for all repo discussions |
| | GitHubProjectConnection | `uk.half-shot.matrix-hookshot.github.project` | Monitor a project board |
| | GitHubUserSpace | `uk.half-shot.matrix-hookshot.github.user.space` | Space for user notifications |
| **GitLab** | GitLabRepoConnection | `uk.half-shot.matrix-hookshot.gitlab.repository` | Monitor project events, run commands |
| | GitLabIssueConnection | `uk.half-shot.matrix-hookshot.gitlab.issue` | Bridge a single issue to a room |
| **JIRA** | JiraProjectConnection | `uk.half-shot.matrix-hookshot.jira.project` | Monitor project events, run commands |
| **Webhooks** | GenericHookConnection | `uk.half-shot.matrix-hookshot.generic.hook` | Receive any HTTP webhook |
| | OutboundHookConnection | `uk.half-shot.matrix-hookshot.outbound-hook` | Forward Matrix messages to external URL |
| **Feeds** | FeedConnection | `uk.half-shot.matrix-hookshot.feed` | Poll RSS/Atom feed |
| **Figma** | FigmaFileConnection | `uk.half-shot.matrix-hookshot.figma.file` | Receive file comments |
| **OpenProject** | OpenProjectConnection | `org.matrix.matrix-hookshot.openproject.project` | Monitor work packages, run commands |
| **ChallengeHound** | HoundConnection | `uk.half-shot.matrix-hookshot.challengehound.activity` | Receive activities |

> **Source:** [`src/Connections/`](https://github.com/matrix-org/matrix-hookshot/blob/main/src/Connections/)

## GitHub

GitHub is the most feature-rich integration, with 6 connection types covering repositories, issues, discussions, projects, and user notifications.

**Inbound events (GitHubRepoConnection):** Issue created/edited/closed/labeled, issue comments, PR opened/closed/merged/reviewed/ready-for-review, pushes, releases, workflow runs. 23 configurable event types, 13 enabled by default.

**Outbound commands:** `!gh create`, `!gh close`, `!gh assign`, `!gh workflow run`

**Emoji reactions:** Matrix emoji reactions map to GitHub reactions. Trash emoji closes issues, checkmark approves PRs.

**Auth:** GitHub App (required for webhooks) + optional user OAuth for per-user actions.

> **Source:** [`src/Connections/GithubRepo.ts:144-218`](https://github.com/matrix-org/matrix-hookshot/blob/main/src/Connections/GithubRepo.ts#L144-L218)

## GitLab

Monitors GitLab projects for merge requests, issues, pushes, tags, wiki changes, and releases.

**Inbound events (GitLabRepoConnection):** MR opened/closed/merged/approved/updated, MR comments, issue comments, releases, tag pushes, pushes, wiki page events. 12 handler bindings.

**Outbound commands:** `!gl create`, `!gl create-confidential`, `!gl close`

**Auth:** Personal access token or OAuth token configured per-instance.

> **Source:** [`src/Connections/GitlabRepo.ts`](https://github.com/matrix-org/matrix-hookshot/blob/main/src/Connections/GitlabRepo.ts)

## JIRA

Monitors JIRA projects for issue creation, updates, and version events. Supports both JIRA Cloud (OAuth 2.0) and JIRA Server/Data Center (OAuth 1.0).

**Inbound events:** Issue created, issue updated, version created/updated/released.

**Outbound commands:** `!jira create`, `!jira issue-types`, `!jira assign`

**Auth:** JIRA Cloud uses OAuth 2.0 via `auth.atlassian.com`. JIRA Server uses OAuth 1.0 with RSA-SHA1.

> **Source:** [`src/Connections/JiraProject.ts`](https://github.com/matrix-org/matrix-hookshot/blob/main/src/Connections/JiraProject.ts)
> **Note:** jira-client package is unmaintained. JIRA Server reached EOL Feb 2024.

## Generic Webhooks

Accepts arbitrary HTTP payloads and delivers them to Matrix rooms. Supports JSON, URL-encoded forms, XML, and plain text.

**Inbound:** Any HTTP POST to a unique webhook URL (`/webhook/{hookId}`).

**Transformation functions:** Optional JavaScript functions (executed in a QuickJS sandbox) that transform the raw payload into a custom Matrix message. Supports v1 and v2 transformation APIs.

**Outbound hooks:** A separate `OutboundHookConnection` forwards Matrix room messages to an external HTTP endpoint.

**No service-specific auth.** Webhook URLs contain a unique UUID and can optionally be protected with secrets.

> **Source:** [`src/Connections/GenericHook.ts:639-737`](https://github.com/matrix-org/matrix-hookshot/blob/main/src/Connections/GenericHook.ts#L639-L737)

## Feeds

Polls RSS and Atom feeds at regular intervals and posts new entries to Matrix rooms.

**Polling:** Uses a Rust-based feed parser. Supports ETag/Last-Modified caching and exponential backoff.

**Message templates:** Customizable with tokens: `$FEEDNAME`, `$TITLE`, `$LINK`, `$AUTHOR`, `$DATE`, `$SUMMARY`. Default template: `"New post in $FEEDNAME: $LINK"`.

**Error handling:** Optional failure notifications when feed polling fails. Last 5 poll results stored for diagnostics.

> **Source:** [`src/Connections/FeedConnection.ts:186-213`](https://github.com/matrix-org/matrix-hookshot/blob/main/src/Connections/FeedConnection.ts#L186-L213) · [`src/feeds/parser.rs`](https://github.com/matrix-org/matrix-hookshot/blob/main/src/feeds/parser.rs)

## Figma

Receives Figma file comment webhooks and posts them to Matrix rooms.

**Inbound:** FILE_COMMENT events only. Other Figma webhook types (FILE_UPDATE, LIBRARY_PUBLISH) are not currently handled.

**Auth:** Figma API token configured per-instance.

> **Source:** [`src/Connections/FigmaFileConnection.ts`](https://github.com/matrix-org/matrix-hookshot/blob/main/src/Connections/FigmaFileConnection.ts)
> **Note:** figma-js package is unmaintained (pre-release pin v1.16.1-0)

## OpenProject

Monitors OpenProject instances for work package creation and updates. Supports OAuth 2.0 with automatic token refresh.

**Inbound events:** Work package created, work package updated.

**Outbound commands:** `!op create`, `!op close`, `!op priority`, `!op assign`, `!op responsible`

> **Source:** [`src/Connections/OpenProjectConnection.ts`](https://github.com/matrix-org/matrix-hookshot/blob/main/src/Connections/OpenProjectConnection.ts)

## ChallengeHound

Receives activity updates from ChallengeHound challenges.

**Inbound:** Activity events (polling-based, not webhook).

> **Source:** [`src/Connections/HoundConnection.ts`](https://github.com/matrix-org/matrix-hookshot/blob/main/src/Connections/HoundConnection.ts)

## How connections are created

Four ways to create a connection in a room:

1. **Bot commands** — `!hookshot {service} {args}` in a Matrix room
2. **Widget UI** — Embedded web interface in Matrix clients
3. **Provisioning API** — REST API at `/widgetapi/v1/{roomId}/connections/{type}`
4. **Static config** — Pre-defined connections in `config.yml`
5. **Direct state events** — Set Matrix room state events directly

The `SetupConnection` handles bot commands for creating connections across all services. It supports 18+ setup commands.

> **Source:** [`src/Connections/SetupConnection.ts`](https://github.com/matrix-org/matrix-hookshot/blob/main/src/Connections/SetupConnection.ts)

## Related

**Concepts:** [Event Lifecycle](../understand/event-lifecycle.md) · [Integration Model](../understand/integration-model.md) · [Trust and Boundaries](../understand/trust-and-boundaries.md)

**Architecture:** [Connections](../architecture/connections.md) — Connection lifecycle and internals

**Reference:** [Bot Commands](../reference/bot-commands.md) · [Event Types](../reference/event-types.md) · [Matrix Spec Map](../reference/matrix-spec-map.md)

**Guides:** [Configuration](../guides/operator/configuration.md) — Service-specific config sections

**Get started:** [Quickstart](../get-started/quickstart.md) · [Evaluate](../get-started/evaluate.md)
