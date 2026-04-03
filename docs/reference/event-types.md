---
title: Event Types Reference
description: All Matrix state event types and message metadata types used by hookshot
audience: [developer, contributor, architect]
---

# Event Types Reference

Hookshot uses custom Matrix state event types to store connection configuration and message metadata. All types follow the pattern `uk.half-shot.matrix-hookshot.{service}.{entity}` (with one exception for OpenProject).

## Connection state event types

These state events store connection configuration in Matrix rooms. Each connection instance is one state event.

| Event type | Connection class | Purpose |
|---|---|---|
| `uk.half-shot.matrix-hookshot.github.repository` | GitHubRepoConnection | GitHub repo monitoring + commands |
| `uk.half-shot.matrix-hookshot.github.issue` | GitHubIssueConnection | Single GitHub issue bridge |
| `uk.half-shot.matrix-hookshot.github.discussion` | GitHubDiscussionConnection | GitHub discussion thread |
| `uk.half-shot.matrix-hookshot.github.discussion.space` | GitHubDiscussionSpace | Space for repo discussions |
| `uk.half-shot.matrix-hookshot.github.project` | GitHubProjectConnection | GitHub project board |
| `uk.half-shot.matrix-hookshot.github.user.space` | GitHubUserSpace | User notification space |
| `uk.half-shot.matrix-hookshot.gitlab.repository` | GitLabRepoConnection | GitLab project monitoring + commands |
| `uk.half-shot.matrix-hookshot.gitlab.issue` | GitLabIssueConnection | Single GitLab issue bridge |
| `uk.half-shot.matrix-hookshot.jira.project` | JiraProjectConnection | JIRA project monitoring + commands |
| `uk.half-shot.matrix-hookshot.generic.hook` | GenericHookConnection | Inbound generic webhook |
| `uk.half-shot.matrix-hookshot.outbound-hook` | OutboundHookConnection | Outbound message forwarding |
| `uk.half-shot.matrix-hookshot.feed` | FeedConnection | RSS/Atom feed polling |
| `uk.half-shot.matrix-hookshot.figma.file` | FigmaFileConnection | Figma file comment bridge |
| `uk.half-shot.matrix-hookshot.challengehound.activity` | HoundConnection | ChallengeHound activity tracking |
| `org.matrix.matrix-hookshot.openproject.project` | OpenProjectConnection | OpenProject monitoring + commands |

The **state key** identifies the specific external resource (e.g., `my-org/my-repo` for a GitHub connection).

<!-- Code: CanonicalEventType static property on each Connection class in src/Connections/*.ts -->

## Message metadata event types

These types appear as custom fields inside `m.room.message` events to carry structured metadata about the source of the notification.

| Field name | Appears on | Content |
|---|---|---|
| `uk.half-shot.matrix-hookshot.github.repo` | GitHub repo notifications | `{ id, full_name, html_url, description }` |
| `uk.half-shot.matrix-hookshot.github.issue` | GitHub issue notifications | `{ id, number, title, html_url }` |
| `uk.half-shot.matrix-hookshot.github.pull_request` | GitHub PR notifications | `{ id, number, title, html_url }` |
| `uk.half-shot.matrix-hookshot.github.push` | GitHub push notifications | Push event metadata |
| `uk.half-shot.matrix-hookshot.github.comment` | GitHub comment notifications | Comment metadata |
| `uk.half-shot.matrix-hookshot.feeds.item` | Feed entry notifications | Full feed entry object |
| `uk.half-shot.matrix-hookshot.jira.issue` | JIRA issue notifications | Issue metadata |

<!-- Code: src/FormatUtil.ts:60-134 (GitHub metadata), src/Connections/FeedConnection.ts:274 (feed item) -->

## System event types

| Event type | Purpose | Stored in |
|---|---|---|
| `uk.half-shot.matrix-hookshot.github.room` | Identifies admin room type | Room state |
| `uk.half-shot.matrix-hookshot.github.notif_state` | GitHub notification filter | Room state |
| `uk.half-shot.matrix-hookshot.gitlab.notif_state` | GitLab notification filter | Room state |
| `uk.half-shot.matrix-hookshot.figma.comment_id` | Figma comment tracking | Room state |
| `uk.half-shot.matrix-hookshot.github.discussion.comment_id` | Discussion comment tracking | Room state |
| `uk.half-shot.matrix-hookshot.grant` | OAuth grant tokens | Account data |
| `org.matrix.matrix-hookshot.openproject.work_package` | OpenProject work package tracking | Room state |

## Legacy event types

These event types were used in older versions and are still supported for backward compatibility. New connections use the current types above.

| Legacy type | Current type |
|---|---|
| `uk.half-shot.matrix-github.repository` | `uk.half-shot.matrix-hookshot.github.repository` |
| `uk.half-shot.matrix-github.bridge` | `uk.half-shot.matrix-hookshot.github.issue` |
| `uk.half-shot.matrix-github.discussion` | `uk.half-shot.matrix-hookshot.github.discussion` |
| `uk.half-shot.matrix-github.discussion.space` | `uk.half-shot.matrix-hookshot.github.discussion.space` |
| `uk.half-shot.matrix-github.project` | `uk.half-shot.matrix-hookshot.github.project` |
| `uk.half-shot.matrix-github.user.space` | `uk.half-shot.matrix-hookshot.github.user.space` |
| `uk.half-shot.matrix-github.notif_state` | `uk.half-shot.matrix-hookshot.github.notif_state` |
| `uk.half-shot.matrix-github.room` | `uk.half-shot.matrix-hookshot.github.room` |
| `uk.half-shot.matrix-github.generic.hook` | `uk.half-shot.matrix-hookshot.generic.hook` |
| `uk.half-shot.matrix-github.gitlab.repository` | `uk.half-shot.matrix-hookshot.gitlab.repository` |
| `uk.half-shot.matrix-github.gitlab.issue` | `uk.half-shot.matrix-hookshot.gitlab.issue` |
| `uk.half-shot.matrix-github.gitlab.notif_state` | `uk.half-shot.matrix-hookshot.gitlab.notif_state` |
| `uk.half-shot.matrix-github.jira.project` | `uk.half-shot.matrix-hookshot.jira.project` |

<!-- Code: LegacyCanonicalEventType properties on Connection classes -->
<!-- Note: No documented migration path from legacy to current types exists -->

## Related

**Architecture:** [Connections](../architecture/connections.md) — How connections use state events

**Integrations:** [Overview](../integrations/overview.md) — All connection types

**Reference:** [Matrix Spec Map](matrix-spec-map.md) · [Bot Commands](bot-commands.md)

**Matrix Spec:** [Room State Events](https://spec.matrix.org/latest/client-server-api/#room-state)
