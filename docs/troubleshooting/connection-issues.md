---
title: "Troubleshooting: Connection Issues"
description: Diagnose problems with creating, using, or removing connections
audience: [operator, user]
symptoms: ["bot doesn't respond", "no notifications", "duplicate messages", "connection not created"]
---

# Connection Issues

The bot isn't responding to commands, connections aren't being created, notifications aren't appearing, or you're getting duplicates.

## Check 1: Is the bot in the room?

The hookshot bot must be a member of the room. Check the room member list for `@hookshot:yourdomain` (or your configured bot localpart).

If not present:
```
/invite @hookshot:yourdomain
```

The bot should auto-accept the invite. If it doesn't, check hookshot logs for invite handling errors.

## Check 2: Does the bot have sufficient power level?

The bot needs:
- PL 0 (default member) to send messages and read state
- Higher PL if the room requires it for state events

Check room settings → Roles and Permissions. The bot should not be restricted.

## Check 3: Are there connections in this room?

List all connections:

```
!hookshot list
```

If no connections appear:
- Create one: `!hookshot github repo <url>`, `!hookshot webhook <name>`, etc.
- Check your permission level — you need `manageConnections` to create connections

If `!hookshot list` gets no response at all, the bot may not be receiving messages. Check logs at `debug` level.

## Check 4: Is the command prefix correct?

Each connection type has its own prefix:

| Integration | Prefix | Example |
|---|---|---|
| Setup commands | `!hookshot` | `!hookshot github repo ...` |
| GitHub repo | `!gh` (default) | `!gh create "Bug"` |
| GitLab repo | `!gl` (default) | `!gl create "Issue"` |
| JIRA project | `!jira` (default) | `!jira create "Ticket"` |
| OpenProject | `!op` (default) | `!op create "WP"` |

The prefix can be customized per connection via the `commandPrefix` option. Check `!hookshot list` for the configured prefix.

## Check 5: Duplicate messages

If you're receiving the same notification multiple times:

1. **Multiple connections to the same resource.** Run `!hookshot list` — if you see the same repo/project connected twice, remove the duplicate.
2. **Multiple hookshot instances** pointed at the same homeserver. Check for duplicate processes.
3. **Room aliases** — if the same room is accessible via multiple aliases, it's still one room (not a duplication cause).

## Check 6: Connection creation fails

When `!hookshot github repo <url>` or similar fails:

| Error | Cause | Fix |
|---|---|---|
| "You do not have permission" | Permission level below `manageConnections` | Admin: upgrade permission level |
| "GitHub is not configured" | No `github` section in config | Operator: add service config |
| "Could not find repository" | Wrong URL or App not installed on that repo | Check URL, install GitHub App |
| No response at all | Bot not in room, or command parsing failed | Check bot membership, check logs |

## Check 7: Events enabled but no notifications

For service-specific connections (GitHub, GitLab, etc.), events can be individually enabled/disabled.

GitHub defaults to 13 of 23 event types. For example, `push` events are **disabled by default**.

Check current config via room state or `!hookshot list`. To enable more events, update the connection config via widget, API, or state event.

<!-- Code: src/Connections/GithubRepo.ts:205-218 (default enabled events) -->

## Check 8: Connection state in Matrix

Connections are stored as room state events. You can inspect them directly:

In Element: Room Settings → Advanced → Room State → look for `uk.half-shot.matrix-hookshot.*` events.

If the state event exists but the connection isn't working, hookshot may not have picked it up. Restart hookshot — it reconstructs all connections from state on startup.

## Check 9: Hookshot logs

Set `logging.level: debug` and look for:

```
# Connection created successfully:
info: New connection created for room !abc:example.com

# Connection not found for event:
debug: No connections found for github event

# Command received but not handled:
debug: Command not handled: !gh unknown
```

## Related

- [Webhooks Not Arriving](webhooks-not-arriving.md) — Webhook-specific diagnostics
- [Authentication](authentication.md) — OAuth and token problems
- [Integration Model](../understand/integration-model.md) — How connections work
- [Troubleshooting Index](index.md)
