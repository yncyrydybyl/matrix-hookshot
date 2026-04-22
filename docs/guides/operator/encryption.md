---
title: Encryption
description: Enable end-to-end encryption support in hookshot
audience: [operator]
---

# Encryption

Hookshot supports end-to-end encryption (E2EE) via MSC3202 and MSC4203. When enabled, hookshot can send and receive encrypted messages in E2EE rooms.

## Requirements

- Redis cache **must** be configured (encryption won't work without it)
- Worker mode (`queue` config) **must NOT** be used with encryption
- Homeserver must support appservice encryption (Synapse v1.63.0+)
- Crypto store directory must persist between restarts

## Configuration

```yaml
encryption:
  storagePath: ./cryptostore    # Must persist between restarts

cache:
  redisUri: "redis://localhost:6379"   # Required for encryption
```

Do NOT set `queue` config when encryption is enabled. Workers are incompatible with encryption.

> **Source:** docs/advanced/encryption.md

## Homeserver setup (Synapse)

For Synapse v1.63.0+, enable experimental features in `homeserver.yaml`:

```yaml
experimental_features:
  msc2409_to_device_messages_enabled: true
  msc3202_device_masquerading: true
  msc3202_transaction_extensions: true
```

The appservice registration file must include:

```yaml
de.sorunome.msc2409.push_ephemeral: true
push_ephemeral: true
org.matrix.msc3202: true
```

## Crypto store

The `storagePath` directory stores encryption keys. **Critical rules:**

- Do not modify files in this directory
- Do not share between hookshot instances
- Back up before upgrades
- If corrupted, reset with: `yarn start:resetcrypto`
- If the homeserver's database is reset, hookshot's crypto state must also be reset

## Limitations

- Incompatible with worker mode (`queue` config)
- Crypto store must be on persistent storage (not ephemeral Docker volumes)
- Startup error "This endpoint can only be called by appservices" usually means the registration file isn't loaded correctly — see [#1137](https://github.com/matrix-org/matrix-hookshot/issues/1137)

## Related

- [Configuration](configuration.md) — Cache and encryption config
- [Installation](installation.md) — Registration file setup
- [Trust and Boundaries](../../understand/trust-and-boundaries.md) — Security model
