---
title: Workers and Scaling
description: Scale hookshot with Redis-backed worker processes
audience: [operator]
status: current
---

# Workers and Scaling

Hookshot can run as a single process or split into multiple worker processes for higher throughput. Worker mode is **experimental**.

## Single process (default)

For most deployments, a single process is sufficient. Hookshot uses ~100 MB at baseline and handles moderate webhook traffic well.

## Worker mode

Worker mode splits hookshot into three processes communicating via Redis:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Webhooks   │    │    App      │    │ MatrixSender│
│  Worker     │◄──►│   Worker    │◄──►│   Worker    │
│             │    │             │    │             │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       └──────────────────┼──────────────────┘
                          │
                    ┌─────▼─────┐
                    │   Redis   │
                    └───────────┘
```

### Requirements

- Redis instance
- Shared config file (all workers read the same config)
- Shared filesystem for passkey and crypto store

### Configuration

Add Redis queue config:

```yaml
queue:
  redisUri: "redis://redis-host:6379"
cache:
  redisUri: "redis://redis-host:6379"
```

### Start workers

Each worker runs as a separate process:

```bash
# Terminal 1: Webhook receiver
yarn start:webhooks

# Terminal 2: Main application logic
yarn start:app

# Terminal 3: Matrix message sender
yarn start:matrixsender
```

Or with Docker, run three containers with different entrypoints.

### Docker example

```bash
# Redis
docker run --name redis -d -p 6379:6379 redis

# Workers (all sharing same config volume)
docker run -d --name hookshot-webhooks \
  -v /etc/hookshot:/data \
  halfshot/matrix-hookshot \
  node lib/App/WebhookApp.js /data/config.yml /data/registration.yml

docker run -d --name hookshot-app \
  -v /etc/hookshot:/data \
  halfshot/matrix-hookshot \
  node lib/App/BridgeApp.js /data/config.yml /data/registration.yml

docker run -d --name hookshot-sender \
  -v /etc/hookshot:/data \
  halfshot/matrix-hookshot \
  node lib/App/MatrixSenderApp.js /data/config.yml /data/registration.yml
```

## Constraints

- **No hybrid mode** — you must run all three workers or none. Don't mix single-process and worker mode.
- **Encryption incompatible** — if encryption is enabled, use `cache` config but do NOT set `queue` config.
- **Shared config** — all workers must read the same config and registration files.

## When to scale

| Symptom | Indicates | Solution |
|---|---|---|
| Webhook responses slow (>1s) | Webhook processing bottleneck | Worker mode |
| Matrix messages delayed | Message send queue backing up | Worker mode |
| High memory usage | Too many rooms / connections | Redis cache + worker mode |
| High CPU | Feed polling or webhook processing | Worker mode + increase poll concurrency |

For most deployments under ~1000 rooms, single process is fine.

## Related

- [Configuration](configuration.md) — Queue and cache config
- [Monitoring](monitoring.md) — Metrics for diagnosing bottlenecks
- [Encryption](encryption.md) — Encryption vs workers constraint
