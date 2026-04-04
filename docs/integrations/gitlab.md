---
title: GitLab Integration
description: Connect Matrix rooms to GitLab projects for merge request, issue, push, and release notifications
audience: [user, operator, developer]
integration: gitlab
status: current
---

# GitLab

Hookshot connects Matrix rooms to GitLab projects. It delivers notifications for merge requests, issues, pushes, tags, wiki changes, and releases. It accepts bot commands to create and close issues.

## Connection types

| Type | State event | Purpose |
|---|---|---|
| Repository | `uk.half-shot.matrix-hookshot.gitlab.repository` | Monitor project events, run commands |
| Issue | `uk.half-shot.matrix-hookshot.gitlab.issue` | Bridge a single issue to a dedicated room |

## Capabilities

| Capability | Supported |
|---|---|
| Receive events in Matrix | Yes — 12 event handler bindings |
| Send commands from Matrix | Yes — 3 commands |
| OAuth | Token-based (personal access tokens) |
| Webhook-based | Yes |
| Bot commands | `!gl` prefix |
| Widget UI | Yes |
| Provisioning API | Yes |
| GitLab.com + self-hosted | Yes — multiple instances supported |

## Supported events

| GitLab event | Handler | Topic |
|---|---|---|
| Merge request opened | `onMergeRequestOpened` | `gitlab.merge_request.open` |
| Merge request reopened | `onMergeRequestReopened` | `gitlab.merge_request.reopen` |
| Merge request closed | `onMergeRequestClosed` | `gitlab.merge_request.close` |
| Merge request merged | `onMergeRequestMerged` | `gitlab.merge_request.merge` |
| Merge request approved | `onMergeRequestReviewed` | `gitlab.merge_request.approved` |
| Merge request unapproved | `onMergeRequestReviewed` | `gitlab.merge_request.unapproved` |
| MR individual approval | `onMergeRequestIndividualReview` | `gitlab.merge_request.approval` |
| Merge request updated | `onMergeRequestUpdate` | `gitlab.merge_request.update` |
| MR/issue comment | `onCommentCreated` | `gitlab.note.created` |
| Release created | `onRelease` | `gitlab.release.create` |
| Tag push | `onGitLabTagPush` | `gitlab.tag_push` |
| Push | `onGitLabPush` | `gitlab.push` |
| Wiki page event | `onWikiPageEvent` | `gitlab.wiki_page` |

> **Source:** [`src/Bridge.ts:501-677`](https://github.com/matrix-org/matrix-hookshot/blob/main/src/Bridge.ts#L501-L677)

## Authentication

GitLab uses **personal access tokens** per user. No instance-wide OAuth.

```
!hookshot gitlab personaltoken <instance-name> <access-token>
```

Check token status:

```
!hookshot gitlab hastoken <instance-name>
```

The `<instance-name>` must match an instance in your config.

## Configuration

```yaml
gitlab:
  instances:
    gitlab.com:                    # Instance name (users reference this)
      url: https://gitlab.com      # GitLab instance URL
    internal:
      url: https://gitlab.internal.com
  webhook:
    secret: "your-webhook-secret"  # Secret token for webhook verification
    publicUrl: https://hookshot.example.com/gitlab/webhook
  userIdPrefix: _gitlab_           # Optional: ghost user prefix
  commentDebounceMs: 5000          # Optional: aggregate comments (ms)
```

You must list all GitLab instances users will connect to. The `publicUrl` is where GitLab sends webhooks — must end with `/gitlab/webhook`.

The `secret` is used as the "Secret token" when adding webhooks in GitLab project settings.

> **Source:** [`src/config/sections/Gitlab.ts`](https://github.com/matrix-org/matrix-hookshot/blob/main/src/config/sections/Gitlab.ts)

## Setup

### Operator: Configure GitLab in hookshot

1. Add the `gitlab` section to config.yml (see above)
2. Ensure the webhook listener is accessible at the `publicUrl`

### User: Connect a room to a GitLab project

1. Authenticate: `!hookshot gitlab personaltoken gitlab.com <your-token>`
2. Connect: `!hookshot gitlab project <project-url>`
3. Or use the widget UI in your Matrix client

### GitLab webhook setup

Add a webhook in GitLab: Project → Settings → Webhooks:
- **URL**: your hookshot `publicUrl` (e.g., `https://hookshot.example.com/gitlab/webhook`)
- **Secret token**: the `webhook.secret` from your config
- **Events**: merge request, push, tag push, issue, note, release, wiki page

## Connection options

| Option | Type | Default | Description |
|---|---|---|---|
| `instance` | string | required | GitLab instance name (from config) |
| `path` | string | required | Project path (e.g., `org/repo`) |
| `enableHooks` | string[] | 14 defaults | Which events to receive |
| `includeCommentBody` | boolean | false | Include comment text in notifications |
| `pushTagsRegex` | string | all | Regex filter for tag push events |
| `includingLabels` | string[] | all | Only show events with these labels |
| `excludingLabels` | string[] | none | Hide events with these labels |

> **Source:** [`src/Connections/GitlabRepo.ts:44-57`](https://github.com/matrix-org/matrix-hookshot/blob/main/src/Connections/GitlabRepo.ts#L44-L57)

### Default enabled events

`merge_request.open`, `merge_request.close`, `merge_request.merge`, `merge_request.reopen`, `merge_request.review`, `merge_request.review.individual`, `merge_request.ready_for_review`, `merge_request.review.comments`, `merge_request`, `tag_push`, `push`, `wiki`, `release`, `release.created`

> **Source:** [`src/Connections/GitlabRepo.ts:86-121`](https://github.com/matrix-org/matrix-hookshot/blob/main/src/Connections/GitlabRepo.ts#L86-L121)

## Bot commands

| Command | Required args | Optional args | Description |
|---|---|---|---|
| `!gl create <title>` | `title` | `description`, `labels` | Create an issue |
| `!gl create-confidential <title>` | `title` | `description`, `labels` | Create a confidential issue |
| `!gl close <number>` | `number` | `comment` | Close an issue |

## Limitations

- GitLab's webhook test button sends payloads without an `action` field — test events won't show up in rooms (but will appear in hookshot logs)
- No OAuth flow — each user must provide their own personal access token
- Comment debouncing (default 5s) aggregates rapid comments into one message
- Legacy webhook path `/` is deprecated — use `/gitlab/webhook`
- No SDK used — hookshot calls the GitLab API v4 directly via HTTP

## Upstream references

| Topic | URL |
|---|---|
| GitLab webhooks | [docs.gitlab.com/webhooks](https://docs.gitlab.com/ee/user/project/integrations/webhooks.html) |
| Personal access tokens | [docs.gitlab.com/tokens](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html) |
| API v4 | [docs.gitlab.com/api](https://docs.gitlab.com/ee/api/rest/) |

## Related

**Concepts:** [Event Lifecycle](../understand/event-lifecycle.md) · [Integration Model](../understand/integration-model.md) · [Trust and Boundaries](../understand/trust-and-boundaries.md)

**Integrations:** [Overview](overview.md) · [GitHub](github.md) — Similar integration · [JIRA](jira.md)

**Reference:** [Bot Commands: GitLab](../reference/bot-commands.md#gitlab-repository-commands) · [Event Types](../reference/event-types.md)

**Operator:** [Configuration](../guides/operator/configuration.md) · [Hardening](../guides/operator/hardening.md)

**Troubleshooting:** [Webhooks Not Arriving](../troubleshooting/webhooks-not-arriving.md) · [Authentication](../troubleshooting/authentication.md#check-2-is-the-service-configured-for-oauth) · [Connection Issues](../troubleshooting/connection-issues.md)
