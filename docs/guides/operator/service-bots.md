---
title: Service Bots
description: Run dedicated bot users for specific services
audience: [operator]
---

# Service Bots

By default, hookshot sends all messages as a single bot user (`@hookshot:yourdomain`). You can configure separate bot users per service for clearer attribution in rooms.

## Configuration

```yaml
serviceBots:
  - localpart: feeds
    displayname: Feeds
    avatar: "./assets/feeds_avatar.png"
    prefix: "!feeds"
    service: feeds
  - localpart: github-bot
    displayname: GitHub
    prefix: "!gh"
    service: github
```

| Field | Required | Description |
|---|---|---|
| `localpart` | Yes | Bot user localpart (e.g., `feeds` → `@feeds:yourdomain`) |
| `displayname` | No | Bot display name |
| `avatar` | No | Path to avatar image file |
| `prefix` | Yes | Command prefix for this bot |
| `service` | Yes | Which service this bot handles |

### Supported services

`feeds`, `figma`, `generic`, `github`, `gitlab`, `jira`, `openproject`

## Registration file

Each service bot needs a user namespace entry in `registration.yml`:

```yaml
namespaces:
  users:
    - regex: "@feeds:yourdomain"
      exclusive: true
    - regex: "@github-bot:yourdomain"
      exclusive: true
```

Restart the homeserver after updating the registration file.

## How it works

When a service bot is configured for a service, all messages from that service are sent using the service bot's identity instead of the default hookshot bot. Commands for that service use the service bot's prefix.

Each room still needs only one invite — the service bot is created and managed by the appservice automatically.

## Related

- [Configuration](configuration.md) — Full config reference
- [Installation](installation.md) — Registration file setup
