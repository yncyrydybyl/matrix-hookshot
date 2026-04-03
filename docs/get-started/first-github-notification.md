---
title: "Tutorial: Your First GitHub Notification"
description: Connect a GitHub repository to a Matrix room and receive PR notifications
audience: [user, operator]
prereqs: [get-started/quickstart.md, integrations/github.md]
time: "15 minutes"
---

# Your First GitHub Notification

Connect a GitHub repository to a Matrix room. When a pull request is opened, a notification appears in the room.

**Prerequisites:**
- A running hookshot instance with [GitHub configured](../integrations/github.md#configuration)
- A GitHub repository you have admin access to (for installing the GitHub App)

## Step 1: Install the GitHub App

If not already done, install the [GitHub App](../integrations/github.md#github-app-required) on your repository or organization. The App provides webhook delivery and API access.

See [GitHub setup](../integrations/github.md#authentication) for detailed instructions.

## Step 2: Authenticate (optional)

For commands that act as you (not required for receiving notifications):

DM the hookshot bot:

```
!github login
```

Follow the OAuth link. See [GitHub authentication](../integrations/github.md#user-oauth-optional) for details.

Check status: `!github status`

## Step 3: Connect a room to a repository

In your Matrix room:

```
!hookshot github repo https://github.com/your-org/your-repo
```

Hookshot confirms the [connection](../understand/integration-model.md) was created. This writes a [room state event](../reference/event-types.md) (`uk.half-shot.matrix-hookshot.github.repository`).

Alternatively, use the [widget UI](../integrations/github.md#setup) or [provisioning API](../integrations/github.md#connection-options).

## Step 4: Trigger a notification

Open a pull request on the connected repository. Within seconds, a message appears in the Matrix room:

```
🔵 your-username opened a new PR your-org/your-repo#1: "Your PR title"
```

This is hookshot's [inbound event flow](../understand/event-lifecycle.md#inbound-external-service-to-matrix) in action: GitHub webhook → signature verification → message queue → connection handler → Matrix message.

## Step 5: Try a command

Create an issue from Matrix:

```
!gh create "Test issue from Matrix"
```

Hookshot creates the issue on GitHub and confirms in the room. This is the [outbound flow](../understand/event-lifecycle.md#outbound-matrix-to-external-service).

See all [GitHub bot commands](../integrations/github.md#bot-commands) or the full [bot commands reference](../reference/bot-commands.md).

## Step 6: Try emoji reactions

React to the PR notification message with 👍. Hookshot adds a thumbs-up reaction on the GitHub PR.

React with ✅ to approve the PR. See [all emoji mappings](../integrations/github.md#emoji-reactions).

## What you learned

- GitHub integration uses a [GitHub App](../integrations/github.md#github-app-required) for webhooks and API access
- [Connections](../understand/integration-model.md) bind a Matrix room to a GitHub repo via [room state events](../reference/event-types.md)
- 13 event types are [enabled by default](../integrations/github.md#supported-events), including PRs, issues, and releases
- [Bot commands](../integrations/github.md#bot-commands) let you create issues and trigger workflows from Matrix
- [Emoji reactions](../integrations/github.md#emoji-reactions) map to GitHub actions

## Customizing

- **Enable more events** (e.g., `push`, `workflow.run`): Update the connection via widget or [connection options](../integrations/github.md#connection-options)
- **Filter by labels**: Use `includingLabels` / `excludingLabels` in [connection options](../integrations/github.md#connection-options)
- **Change command prefix**: Set `commandPrefix` in connection options (default: `!gh`)

## Troubleshooting

| Problem | Solution |
|---|---|
| No notification after PR | Check [Webhooks Not Arriving](../troubleshooting/webhooks-not-arriving.md) |
| "Not authorized" on commands | Run `!github login` — see [Authentication troubleshooting](../troubleshooting/authentication.md) |
| Can't connect repo | Check [permissions](../guides/operator/configuration.md#permissions) — need `manageConnections` level |
| Bot doesn't respond | See [Connection Issues](../troubleshooting/connection-issues.md) |

## Next steps

- [GitHub Integration](../integrations/github.md) — Full reference with all 23 events, 6 connection types
- [GitLab Integration](../integrations/gitlab.md) — Similar setup for GitLab projects
- [JIRA Integration](../integrations/jira.md) — Bridge JIRA projects
- [Integration Overview](../integrations/overview.md) — All 8 services at a glance
- [Event Lifecycle](../understand/event-lifecycle.md) — Deep dive into event flow
