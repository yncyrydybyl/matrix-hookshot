---
title: ChallengeHound Integration
description: Receive ChallengeHound activity notifications in Matrix rooms
audience: [user, operator]
integration: challengehound
status: current
---

# ChallengeHound

Hookshot bridges ChallengeHound challenge activities into Matrix rooms. Activity updates are polled periodically (not webhook-based).

## Capabilities

| Capability | Supported |
|---|---|
| Receive events | Yes — activities |
| Bot commands | Via `!hookshot challenghound` |
| Authentication | API token |
| Webhook-based | No — polling |

## Configuration

```yaml
challengeHound:
  token: "your-api-token"
```

## Setup

```
!hookshot challenghound add <challenge-url>
```

Remove: `!hookshot challenghound remove <challenge-url>`

## Limitations

- Polling-based — updates may be delayed
- Minimal integration — activity events only
- Limited documentation available for the ChallengeHound API

## Related

- [Integration Overview](overview.md)
