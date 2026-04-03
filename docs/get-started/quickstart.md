---
title: Quickstart
description: Get hookshot running and receive your first webhook in 5 minutes
audience: [evaluator, operator]
time: "5 minutes"
---

# Quickstart

Get hookshot running with Docker and receive a webhook in a Matrix room. This uses the included development docker-compose setup with Synapse, Element, and hookshot.

**Prerequisites:** Docker and Docker Compose installed.

## Step 1: Clone and start

```bash
git clone https://github.com/matrix-org/matrix-hookshot.git
cd matrix-hookshot
docker compose up -d
```

This starts:
- **Synapse** (Matrix homeserver) on `localhost:8008`
- **Element** (Matrix client) on `localhost:8083`
- **Hookshot** with webhooks on `localhost:9000`
- **Valkey** (Redis-compatible cache)

Wait ~30 seconds for all services to initialize.

<!-- Code: docker-compose.yml -->

## Step 2: Log into Element

1. Open [http://localhost:8083](http://localhost:8083) in your browser
2. Click "Sign in"
3. Set homeserver to `http://localhost:8008`
4. Register a new account (e.g., `admin` / `admin`)

## Step 3: Create a room and invite the bot

1. Create a new room (e.g., "Webhook Test")
2. Invite `@hookshot:localhost` to the room
3. The bot should join automatically

## Step 4: Create a webhook

In the room, send:

```
!hookshot webhook test-hook
```

Hookshot responds with a webhook URL:

```
Webhook test-hook created. URL: http://localhost:9000/webhook/<hookId>
```

Copy the URL.

<!-- Code: src/Connections/SetupConnection.ts — webhook setup command -->

## Step 5: Send a test payload

In a terminal:

```bash
curl -X POST http://localhost:9000/webhook/<hookId> \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello from the outside!"}'
```

Expected response:

```json
{"ok":true}
```

## Step 6: See the result

Back in Element, a message appears in the room:

```
Hello from the outside!
```

The JSON `text` field was extracted and delivered as a Matrix message.

<!-- Code: src/Connections/GenericHook.ts:609-629 — text field extraction -->

## What just happened

1. `!hookshot webhook` created a **GenericHookConnection** stored as a Matrix room state event (`uk.half-shot.matrix-hookshot.generic.hook`)
2. Hookshot registered a unique webhook URL for that connection
3. Your `curl` hit hookshot's HTTP listener on port 9000
4. The webhook router matched the URL to your connection
5. The connection extracted the `text` field and formatted a Matrix message
6. Hookshot sent the message to the room via Synapse's client-server API

This is the same inbound event flow that all hookshot integrations use. See [Event Lifecycle](../understand/event-lifecycle.md) for the full picture.

## Try a richer payload

```bash
curl -X POST http://localhost:9000/webhook/<hookId> \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Build #42 failed",
    "html": "<b>Build #42</b> <a href=\"https://ci.example.com/42\">failed</a>",
    "username": "CI Bot"
  }'
```

Hookshot recognizes `text`, `html`, and `username` fields and formats the message accordingly.

<!-- Code: src/Connections/GenericHook.ts:601-632 -->

## Next steps

| I want to... | Read |
|---|---|
| Connect GitHub to a room | [GitHub Integration](../integrations/github.md) |
| Write transformation functions | [Generic Webhooks](../integrations/generic-webhooks.md) |
| Deploy to production | [Installation Guide](../guides/operator/installation.md) |
| Understand how it all works | [What is Hookshot](../understand/what-is-hookshot.md) |

## Cleaning up

```bash
docker compose down -v
```

The `-v` flag removes the data volumes.

## Related

**Concepts:** [What is Hookshot](../understand/what-is-hookshot.md) · [Event Lifecycle](../understand/event-lifecycle.md) · [Integration Model](../understand/integration-model.md)

**Next tutorials:** [First Webhook (with transformations)](first-webhook.md) · [First GitHub Notification](first-github-notification.md)

**Integration:** [Generic Webhooks](../integrations/generic-webhooks.md) · [All Integrations](../integrations/overview.md)

**Operator:** [Installation (production)](../guides/operator/installation.md) · [Configuration](../guides/operator/configuration.md)

**Troubleshooting:** [Webhooks Not Arriving](../troubleshooting/webhooks-not-arriving.md) · [Common Errors](../troubleshooting/common-errors.md)
