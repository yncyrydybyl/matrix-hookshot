---
title: Feeds Integration
description: Bridge RSS and Atom feeds into Matrix rooms
audience: [user, operator]
integration: feeds
status: current
---

# RSS/Atom Feeds

Hookshot polls RSS and Atom feeds and posts new entries to Matrix rooms. No webhooks needed — hookshot fetches feeds on a configurable interval.

## Capabilities

| Capability | Supported |
|---|---|
| Receive notifications | Yes — new feed entries |
| Bot commands | Via `!hookshot feed` |
| Authentication | None (public feeds only) |
| Custom templates | Yes — token-based message templates |
| Error notifications | Optional — notify on fetch failures |
| Persistence | Requires Redis to avoid re-posting after restart |

## Configuration

```yaml
feeds:
  enabled: true
  pollIntervalSeconds: 600    # Check feeds every 10 minutes
  pollTimeoutSeconds: 30      # Timeout per feed fetch
  pollConcurrency: 4          # Parallel feed fetches
```

Feeds are parsed in Rust for performance. Supports ETag/Last-Modified caching.

<!-- Code: src/feeds/parser.rs (Rust), config.sample.yml feeds section -->

**Redis required for persistence:** Without Redis, hookshot runs an "initial sync" on each startup and treats all existing entries as already seen. Previously seen entries are lost on restart, which may cause re-posting.

```yaml
cache:
  redisUri: "redis://localhost:6379"
```

## Setup

### Add a feed to a room

```
!hookshot feed https://blog.example.com/rss.xml
```

With a custom label and template:

```
!hookshot feed https://blog.example.com/rss.xml "Team Blog" "📰 $TITLE by $AUTHOR: $LINK"
```

### List subscribed feeds

```
!hookshot feed list
!hookshot feed list json    # JSON format
!hookshot feed list yaml    # YAML format
```

### Remove a feed

```
!hookshot feed remove https://blog.example.com/rss.xml
```

## Message templates

Customize how feed entries appear in Matrix. Available tokens:

| Token | Description |
|---|---|
| `$FEEDNAME` | Feed label, title, or URL |
| `$FEEDURL` | Feed URL |
| `$FEEDTITLE` | Feed title from the feed itself |
| `$TITLE` | Entry title |
| `$URL` | Entry URL |
| `$LINK` | Entry as markdown link: `[$TITLE]($URL)` |
| `$AUTHOR` | Entry author |
| `$DATE` | Publication date |
| `$SUMMARY` | Entry summary (truncated to 512 chars) |

Default template: `New post in $FEEDNAME: $LINK`

<!-- Code: src/Connections/FeedConnection.ts:186-213 -->

## Connection options

| Option | Type | Default | Description |
|---|---|---|---|
| `url` | string | required | Feed URL (RSS or Atom) |
| `label` | string | feed title | Display name for the feed |
| `template` | string | see above | Message template (max 1024 chars) |
| `notifyOnFailure` | boolean | false | Send error message when fetch fails |

## How it works

1. `FeedReader` service polls each feed URL at `pollIntervalSeconds` intervals
2. Rust feed parser fetches and parses the feed (RSS 2.0 or Atom 1.0)
3. New entries (not previously seen) produce `feed.entry` events on the message queue
4. `FeedConnection.handleFeedEntry()` formats the message using the template
5. Message sent to the Matrix room

Each feed is polled once regardless of how many rooms subscribe to it. Entry deduplication uses MD5 hashing.

<!-- Code: src/Connections/FeedConnection.ts:244-284, src/feeds/parser.rs -->

## Diagnostics

The provisioning API returns the last 5 poll results per feed, including timestamps and error messages. This helps diagnose failing feeds.

## Limitations

- Public feeds only — no authentication for feed fetching
- No content filtering — all new entries are posted
- MD5 used for deduplication (not for security)
- Without Redis, feed state is lost on restart
- Summary is truncated to 512 characters
- Entries are not sorted by date before posting — they arrive in feed order
- Message retry: 5 attempts with 5-second intervals on send failure

<!-- Code: src/Connections/FeedConnection.ts:276-283 (retry logic) -->

## Upstream references

| Topic | URL |
|---|---|
| RSS 2.0 specification | [rssboard.org/rss-specification](https://www.rssboard.org/rss-specification) |
| Atom specification | [RFC 4287](https://tools.ietf.org/html/rfc4287) |

## Related

- [Integration Overview](overview.md)
- [Quickstart](../get-started/quickstart.md)
- [Configuration](../guides/operator/configuration.md#cache-optional) — Redis config for persistence
