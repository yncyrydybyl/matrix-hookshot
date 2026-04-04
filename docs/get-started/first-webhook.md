---
title: "Tutorial: Your First Webhook"
description: Receive an external webhook in a Matrix room with a custom transformation
audience: [user, developer]
prereqs: [get-started/quickstart.md]
time: "10 minutes"
---

# Your First Webhook

In this tutorial, you'll create a generic webhook, send test payloads, and write a transformation function to customize the Matrix message. This builds on the [Quickstart](quickstart.md).

**Prerequisites:** A running hookshot instance ([Quickstart](quickstart.md) if you don't have one).

## Step 1: Create a webhook

In your Matrix room, send:

```
!hookshot webhook ci-alerts
```

Hookshot responds with a webhook URL. Copy it.

This creates a [GenericHookConnection](../integrations/generic-webhooks.md) stored as a Matrix [room state event](../reference/event-types.md) (`uk.half-shot.matrix-hookshot.generic.hook`). See [how connections work](../understand/integration-model.md).

## Step 2: Send a basic payload

```bash
curl -X POST <your-webhook-url> \
  -H "Content-Type: application/json" \
  -d '{"text": "Build #42 passed"}'
```

The `text` field is extracted and appears as a Matrix message. Hookshot also recognizes `html` and `username` fields — see [Generic Webhooks: Message formatting](../integrations/generic-webhooks.md#message-formatting).

## Step 3: Send a structured payload

Real webhooks send richer data. Try a CI-like payload:

```bash
curl -X POST <your-webhook-url> \
  -H "Content-Type: application/json" \
  -d '{
    "pipeline": "deploy",
    "build_number": 42,
    "status": "failed",
    "branch": "main",
    "commit": "abc1234",
    "author": "alice",
    "url": "https://ci.example.com/builds/42"
  }'
```

Without a transformation function, hookshot displays the raw JSON. Not very readable.

## Step 4: Add a transformation function

Update the webhook to use a [transformation function](../integrations/generic-webhooks.md#transformation-functions). In the [widget UI](../integrations/generic-webhooks.md#create-via-provisioning-api), or via the provisioning API:

```bash
curl -X PUT <hookshot>/widgetapi/v1/<roomId>/connections/<connectionId> \
  -H "Content-Type: application/json" \
  -d '{
    "transformationFunction": "const icon = data.status === \"success\" ? \"✅\" : \"❌\"; result = { version: \"v2\", plain: `${icon} ${data.pipeline} #${data.build_number}: ${data.status} (${data.branch}) by ${data.author}`, html: `${icon} <b>${data.pipeline}</b> <a href=\"${data.url}\">#${data.build_number}</a>: <b>${data.status}</b> (${data.branch}) by ${data.author}` };"
  }'
```

Or write it more readably — the function is:

```javascript
const icon = data.status === "success" ? "✅" : "❌";
result = {
  version: "v2",
  plain: `${icon} ${data.pipeline} #${data.build_number}: ${data.status} (${data.branch}) by ${data.author}`,
  html: `${icon} <b>${data.pipeline}</b> <a href="${data.url}">#${data.build_number}</a>: <b>${data.status}</b> (${data.branch}) by ${data.author}`
};
```

Transformation functions run in a [QuickJS sandbox](../understand/trust-and-boundaries.md#transformation-function-sandbox) — no network access, 500ms timeout. See [transformation rules](../integrations/generic-webhooks.md#transformation-function-rules).

## Step 5: Test the transformation

Resend the CI payload from Step 3. Now you see:

```
❌ deploy #42: failed (main) by alice
```

Try a success:

```bash
curl -X POST <your-webhook-url> \
  -H "Content-Type: application/json" \
  -d '{"pipeline":"deploy","build_number":43,"status":"success","branch":"main","commit":"def5678","author":"bob","url":"https://ci.example.com/builds/43"}'
```

```
✅ deploy #43: success (main) by bob
```

## What you learned

- [Generic webhooks](../integrations/generic-webhooks.md) accept any HTTP POST and deliver it to Matrix
- Without a transformation, hookshot extracts `text`/`html` fields or shows raw JSON
- [Transformation functions](../integrations/generic-webhooks.md#transformation-functions) let you format any payload into a readable message
- The `data` variable contains the parsed payload, `result` controls the output
- Functions run in a [sandboxed environment](../understand/trust-and-boundaries.md#transformation-function-sandbox)

## Next steps

- [Connect a GitHub repository](first-github-notification.md) for real integration notifications
- [Generic Webhooks reference](../integrations/generic-webhooks.md) for all options including outbound hooks
- [Event Lifecycle](../understand/event-lifecycle.md) to understand the full flow
- [Bot Commands reference](../reference/bot-commands.md) for all available commands
- [Troubleshooting: Webhooks Not Arriving](../troubleshooting/webhooks-not-arriving.md) if something doesn't work
