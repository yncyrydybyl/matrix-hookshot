---
title: Monitoring
description: Prometheus metrics, Sentry error reporting, and health checks for hookshot
audience: [operator]
---

# Monitoring

Hookshot provides Prometheus metrics, Sentry error reporting, and HTTP health probes.

## Prometheus metrics

Enable in config:

```yaml
metrics:
  enabled: true
```

Bind a listener:

```yaml
listeners:
  - port: 9001
    bindAddress: 127.0.0.1
    resources:
      - metrics
```

Metrics are exposed at `http://127.0.0.1:9001/metrics` in Prometheus exposition format.

### Key metrics to monitor

| Metric | Type | What it tells you |
|---|---|---|
| `hookshot_webhooks_received_total` | Counter | Inbound webhook volume by service |
| `hookshot_matrix_messages_sent_total` | Counter | Messages delivered to Matrix |
| `hookshot_matrix_messages_failed_total` | Counter | Failed Matrix message sends |
| `hookshot_connections_total` | Gauge | Active connection count |
| `hookshot_queue_depth` | Gauge | Message queue backlog |
| `hookshot_feed_fetch_duration_seconds` | Histogram | Feed polling performance |
| `hookshot_webhook_processing_duration_seconds` | Histogram | Webhook handling latency |

For the full list, see [Reference: Metrics](../../reference/metrics.md) (auto-generated from code).

### Grafana dashboard

An example Grafana dashboard is available at [`contrib/hookshot-dashboard.json`](https://github.com/matrix-org/matrix-hookshot/blob/main/contrib/hookshot-dashboard.json).

Dashboard variables:
- **Data Source**: Your Prometheus instance with hookshot metrics
- **Interval**: Your scrape interval (e.g., 15s)
- **2x Interval**: Double the interval value

### Alert suggestions

| Condition | Severity | Meaning |
|---|---|---|
| `hookshot_matrix_messages_failed_total` increasing | Warning | Hookshot can't deliver messages — homeserver may be down |
| `hookshot_queue_depth` > 100 sustained | Warning | Processing backlog building up |
| `hookshot_webhooks_received_total` flat for >1h | Info | No webhooks arriving — may be expected or may indicate a problem |
| Process not running | Critical | Hookshot is down |

## Sentry error reporting

```yaml
sentry:
  dsn: https://examplePublicKey@o0.ingest.sentry.io/0
  environment: production
```

Unhandled errors and warnings are reported to Sentry with context (module, room ID, connection type).

## Health probes

Hookshot exposes two health endpoints on the webhook listener:

| Endpoint | Purpose | Returns 200 when |
|---|---|---|
| `/live` | Liveness probe | Process is running |
| `/ready` | Readiness probe | Bridge is fully initialized |

Use these in Kubernetes or Docker health checks:

```yaml
# docker-compose.yml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:9000/ready"]
  interval: 30s
  timeout: 5s
  retries: 3
```

```yaml
# Kubernetes
livenessProbe:
  httpGet:
    path: /live
    port: 9000
readinessProbe:
  httpGet:
    path: /ready
    port: 9000
```

> **Source:** [`src/ListenerService.ts`](https://github.com/matrix-org/matrix-hookshot/blob/main/src/ListenerService.ts)

## Log monitoring

For log-based monitoring, enable JSON logging:

```yaml
logging:
  level: info
  json: true
```

Key log patterns:

| Pattern | Meaning |
|---|---|
| `"level":"ERROR"` | Needs attention |
| `"message":"Failed to connect to homeserver"` | Homeserver unreachable |
| `"message":"Failed to send event"` | Matrix message delivery failure |
| `"message":"Webhook received"` | Normal inbound webhook (debug level) |

## Related

- [Configuration](configuration.md) — Metrics and Sentry config
- [Reference: Metrics](../../reference/metrics.md) — Full metric list
- [Troubleshooting](../../troubleshooting/index.md) — Diagnose problems
- [Workers and Scaling](workers-and-scaling.md) — Scale under load
