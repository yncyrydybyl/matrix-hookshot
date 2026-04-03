---
title: Upgrading
description: How to upgrade hookshot between versions
audience: [operator]
---

# Upgrading

## General upgrade process

1. **Read the changelog** for breaking changes between your current and target version. See [CHANGELOG.md](https://github.com/matrix-org/matrix-hookshot/blob/main/CHANGELOG.md).
2. **Back up** your `config.yml`, `registration.yml`, and `passkey.pem`
3. **Stop hookshot**
4. **Update** the Docker image or rebuild from source
5. **Validate config**: `yarn validate-config` (or Docker equivalent)
6. **Start hookshot** and check logs for errors

### Docker

```bash
docker pull halfshot/matrix-hookshot:latest
docker stop hookshot
docker rm hookshot
docker run ... # same flags as before, new image
```

Or with docker-compose:

```bash
docker compose pull
docker compose up -d
```

### From source

```bash
git pull
yarn install
yarn build
NODE_ENV=production yarn start
```

## What persists across upgrades

| Data | Storage | Survives upgrade? |
|---|---|---|
| Connection configuration | Matrix room state events | Yes — stored on homeserver |
| User OAuth tokens | Encrypted token file (passkey.pem) | Yes — if passkey.pem is preserved |
| Feed polling state | Redis (if configured) | Yes — if Redis data persists |
| Feed polling state | Memory (no Redis) | No — feeds may re-post entries |
| Encryption state | cryptostore directory | Yes — if directory persists |
| Bot room memberships | Homeserver | Yes |

**Critical:** Never lose `passkey.pem`. All stored OAuth tokens are encrypted with this key. A new key means all users must re-authenticate.

## State event migration

Hookshot supports **legacy state event types** (e.g., `uk.half-shot.matrix-github.repository`) alongside current types (`uk.half-shot.matrix-hookshot.github.repository`). Existing connections using legacy types continue to work.

New connections always use the current type. There is no automated migration from legacy to current types.

<!-- Code: LegacyCanonicalEventType properties on Connection classes -->

## Breaking changes to watch for

When upgrading across major versions, check for:

- **Config key changes** — renamed or restructured config sections
- **Permission model changes** — new permission levels or changed defaults
- **Appservice registration changes** — new user namespaces for new services
- **Node.js version requirements** — currently requires Node 22+
- **Rust toolchain requirements** — if building from source

## Rollback

If an upgrade fails:

1. Stop the new version
2. Restore the previous Docker image or git checkout
3. Start with the old version

Connection state in Matrix rooms is not affected by hookshot version changes. The homeserver stores this data independently.

## Related

- [Installation](installation.md) — Fresh installation
- [Configuration](configuration.md) — Config reference
- [Reference: Event Types](../../reference/event-types.md) — State event types including legacy
