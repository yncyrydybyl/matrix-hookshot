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

<!-- Code: src/Bridge.ts:501-677 (handler bindings) -->

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

<!-- Code: src/config/sections/Gitlab.ts -->

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

## Bot commands

| Command | Description | Example |
|---|---|---|
| `!gl create <title>` | Create an issue | `!gl create "Fix deployment"` |
| `!gl create-confidential <title>` | Create a confidential issue | `!gl create-confidential "Security vuln"` |
| `!gl close <number>` | Close an issue | `!gl close 42` |

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

- [Integration Overview](overview.md) — All integrations
- [Event Lifecycle](../understand/event-lifecycle.md) — How events flow
- [Reference: Event Types](../reference/event-types.md) — GitLab state events
