---
title: Known Limitations
description: Honest list of what hookshot cannot do and known issues
audience: [evaluator, operator, architect]
---

# Known Limitations

Honest accounting of what hookshot can't do, what's broken, and what to watch out for.

## Architectural limitations

| Limitation | Impact | Workaround |
|---|---|---|
| **Matrix room state as database** | No cross-room queries. Can't list "all connections for org X" without scanning every room. | Accept this trade-off or build external tooling via [provisioning API](../reference/provisioning-api.md) |
| **No exactly-once delivery** | Duplicate messages possible after restarts (especially [feeds](../integrations/feeds.md) without Redis) | Configure Redis for [feed persistence](../integrations/feeds.md#configuration). Accept occasional duplicates for webhooks. |
| **Single homeserver** | One hookshot instance = one homeserver | Deploy separate instances per homeserver |
| **Startup connection scan** | Slow startup with many rooms (scans all rooms, concurrency of 2) | [#1088](https://github.com/matrix-org/matrix-hookshot/issues/1088) — startup retry for failed connections |
| **No webhook signature for generic hooks** | URL secrecy is the only protection | Treat URLs as secrets, use [expiration dates](../integrations/generic-webhooks.md#connection-options), see [hardening](../guides/operator/hardening.md) |

## Service-specific limitations

### GitHub
- Discussion support requires separate `GitHubDiscussionSpace` connection — can't be toggled on a repo connection
- GitHub Enterprise requires explicit `enterpriseUrl` (no auto-detection)
- [Personal notifications doubleposting](https://github.com/matrix-org/matrix-hookshot/issues/1227) (known bug)

### GitLab
- No OAuth flow — each user provides their own personal access token
- GitLab webhook test button sends payloads without `action` field — test events won't appear in rooms
- Raw HTTP calls to API v4 (no SDK) — no automatic rate limiting or pagination improvements

### JIRA
- `jira-client` npm package (v8.2.2) is **unmaintained**
- JIRA Server reached **EOL February 2024** — Data Center may behave differently
- OAuth 1.0 with RSA-SHA1 for Server is legacy, no token refresh
- Only issue and version events — no boards, sprints, comments

### Feeds
- **Public feeds only** — no authentication for feed fetching
- Without Redis, **all entries re-post after restart**
- Entries arrive in feed order, not sorted by publication date ([#1099](https://github.com/matrix-org/matrix-hookshot/issues/1099))
- No content filtering — all new entries posted

### Figma
- `figma-js` package is **unmaintained** (pinned to pre-release v1.16.1-0)
- Only `FILE_COMMENT` events — no FILE_UPDATE, LIBRARY_PUBLISH
- Requires Figma Professional plan

### Generic webhooks
- **No signature verification** — URL-based security only
- [Static webhooks with transformation functions fail](https://github.com/matrix-org/matrix-hookshot/issues/1228) due to late QuickJS init (S-Major)
- [waitForComplete + transformation returns HTTP error](https://github.com/matrix-org/matrix-hookshot/issues/1251)
- 500ms transformation timeout (hardcoded, not configurable)
- Legacy v1 transformation API still supported — no removal timeline

### OpenProject
- Only work package events — no time entries, meetings, wiki
- Different state event prefix (`org.matrix.matrix-hookshot.*` vs `uk.half-shot.*`)

## Operational limitations

| Limitation | Impact | Reference |
|---|---|---|
| [Encryption incompatible with workers](../guides/operator/workers-and-scaling.md#constraints) | Can't scale encrypted deployments horizontally | Use single process for E2EE |
| [Network failures during startup miss connections](https://github.com/matrix-org/matrix-hookshot/issues/1087) | Rooms connected during a transient failure are silently skipped | Restart hookshot after network recovery |
| [Display names reset on upgrade](https://github.com/matrix-org/matrix-hookshot/issues/1149) | Bot display names may revert after redeployment | Re-set display names manually |
| No built-in rate limiting for outbound API calls | Could hit external service rate limits under heavy use | Monitor via [metrics](../guides/operator/monitoring.md) |

## Dependency risks

| Dependency | Risk | Status |
|---|---|---|
| `jira-client` v8.2.2 | Unmaintained | No replacement planned |
| `figma-js` v1.16.1-0 | Unmaintained, pre-release pin | No replacement planned |
| `matrix-bot-sdk` v0.8.0-element.3 | Element-specific fork | Tied to Element's release cadence |
| `xml2js` (for XML webhooks) | Has had CVEs historically | Verify current version |

## Platform gaps

| Platform | Status |
|---|---|
| Gitea / Forgejo / Codeberg | Not supported ([#304](https://github.com/matrix-org/matrix-hookshot/issues/304) — feature request, no active work) |
| Slack | Not in scope (use [matrix-appservice-slack](https://github.com/matrix-org/matrix-appservice-slack)) |
| Discord | Not in scope (use [mautrix-discord](https://github.com/mautrix/discord)) |
| Linear | Not supported |
| Asana | Not supported |
| Trello | Not supported |

## Related

**Project:** [Roadmap](roadmap.md) · [Ecosystem](ecosystem.md)

**Architecture:** [Failure and Recovery](../architecture/failure-and-recovery.md) · [State and Storage](../architecture/state-and-storage.md)

**Operator:** [Hardening](../guides/operator/hardening.md) · [Monitoring](../guides/operator/monitoring.md)

**Get Started:** [Evaluate](../get-started/evaluate.md) — Feature comparison
