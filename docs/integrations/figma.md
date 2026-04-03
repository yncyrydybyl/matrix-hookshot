---
title: Figma Integration
description: Receive Figma file comment notifications in Matrix rooms
audience: [user, operator]
integration: figma
status: current
---

# Figma

Hookshot bridges Figma file comment notifications into Matrix rooms. When someone comments on a connected Figma file, the comment appears in the linked Matrix room.

## Capabilities

| Capability | Supported |
|---|---|
| Receive events | Yes — FILE_COMMENT only |
| Bot commands | Via `!hookshot figma file` |
| OAuth | No — uses personal access token |
| Webhook-based | Yes — auto-configured by hookshot |

## Configuration

Requires a Figma Professional plan (free tier doesn't support webhooks).

```yaml
figma:
  publicUrl: https://hookshot.example.com/figma/webhook
  instances:
    your-instance:
      teamId: "your-team-id"
      accessToken: "your-personal-access-token"
      passcode: "random-webhook-passcode"
```

- `your-instance`: a friendly name (e.g., `my-team`)
- `teamId`: from the Figma team page URL (e.g., `12345` in `figma.com/files/team/12345/...`)
- `accessToken`: personal access token with admin access to the team
- `passcode`: random string for webhook verification
- `publicUrl`: must reach hookshot's `/figma/webhook` endpoint

Hookshot automatically registers the webhook with Figma on startup and reconfigures it if `publicUrl` or `passcode` changes.

## Setup

### Connect a file to a room

```
!hookshot figma file <file-url>
```

Where `<file-url>` is the Figma file URL, e.g., `https://www.figma.com/files/project/12345/...`

## Limitations

- Only FILE_COMMENT events are handled — no FILE_UPDATE, LIBRARY_PUBLISH, or other events
- `figma-js` package is unmaintained (pinned to pre-release v1.16.1-0)
- One team per instance — multiple teams need multiple instance configs
- No user-level auth — all actions use the instance-level access token

## Upstream references

| Topic | URL |
|---|---|
| Figma webhooks | [figma.com/developers/api#webhooks](https://www.figma.com/developers/api#webhooks) |
| Figma REST API | [figma.com/developers/api](https://www.figma.com/developers/api) |

## Related

- [Integration Overview](overview.md)
- [Configuration](../guides/operator/configuration.md)
