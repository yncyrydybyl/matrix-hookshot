---
title: Extensibility
description: How to add a new integration to hookshot — step by step
audience: [contributor]
---

# Extensibility

This page walks through adding a new integration to hookshot. It's the practical companion to [Connections](connections.md) (which explains the abstraction) and [Component Model](component-model.md) (which maps the codebase).

## What you're building

A new integration means a new [Connection](connections.md) class. At minimum, it needs:

1. A class that extends `BaseConnection` (or `CommandConnection` for bot command support)
2. A [state event type](../reference/event-types.md) for storing configuration
3. Registration with the connection type system
4. A way to receive events (webhook route or polling service)
5. [Documentation](../integrations/overview.md) following the integration template

## Step 1: Create the Connection class

```typescript
// src/Connections/MyService.ts
import { BaseConnection } from "./BaseConnection";
import { IConnection } from "./IConnection";
import { Connection } from "./type";

interface MyServiceConnectionState {
  url: string;
  enableHooks?: string[];
}

@Connection
export class MyServiceConnection extends BaseConnection implements IConnection {
  // State event type — follows uk.half-shot.matrix-hookshot.{service} pattern
  static readonly CanonicalEventType = "uk.half-shot.matrix-hookshot.myservice";
  static readonly EventTypes = [MyServiceConnection.CanonicalEventType];
  static readonly ServiceCategory = "myservice";

  constructor(
    roomId: string,
    stateKey: string,
    private state: MyServiceConnectionState,
    private readonly messageClient: MessageSenderClient,
  ) {
    super(roomId, stateKey, MyServiceConnection.CanonicalEventType);
  }

  // Required: determine if this connection cares about a state event
  public isInterestedInStateEvent(eventType: string, stateKey: string): boolean {
    return MyServiceConnection.EventTypes.includes(eventType);
  }

  // Provisioning: create from API/widget/bot command
  static async provisionConnection(
    roomId: string, userId: string, data: Record<string, unknown>,
  ): Promise<MyServiceConnection> {
    // Validate data, create connection, write state event
  }

  // Provisioning: return config for the widget UI
  public getProvisionerDetails(): GetConnectionsResponseItem {
    return { /* connection config for display */ };
  }

  // Handle inbound events from your service
  public async onMyServiceEvent(data: unknown): Promise<void> {
    // Format message, send to Matrix room
    await this.messageClient.sendMatrixMessage(this.roomId, {
      msgtype: "m.notice",
      body: "Event received from MyService",
      // ... formatted message
    });
  }

  // Cleanup on removal
  public async onRemove(): Promise<void> {
    // Unregister webhooks, clean up resources
  }
}
```

For bot command support, extend `CommandConnection` instead and add `@botCommand` decorators. See [GitHub repo connection](../integrations/github.md#bot-commands) for examples.

<!-- Code: src/Connections/BaseConnection.ts, src/Connections/IConnection.ts -->

## Step 2: Register the connection type

Add your connection to the type registry in `src/Connections/index.ts` and ensure the `@Connection` decorator is applied to the class.

## Step 3: Add webhook routing (if webhook-based)

Add a route in `src/Webhooks.ts`:

```typescript
// In Webhooks constructor
this.expressRouter.use("/myservice", myServiceRouter);
```

Create a router that verifies signatures and publishes to the [message queue](state-and-storage.md#message-queue):

```typescript
// src/myservice/Router.ts
router.post("/webhook", (req, res) => {
  // Verify signature/secret
  // Publish event to queue
  this.queue.push({ eventName: "myservice.event_name", data: req.body });
});
```

## Step 4: Bind queue handlers in Bridge.ts

Add handler bindings in `src/Bridge.ts`:

```typescript
this.bindHandlerToQueue<MyEventType, MyServiceConnection>(
  "myservice.event_name",
  (data) => connManager.getConnectionsForMyService(data.resource),
  (connection, data) => connection.onMyServiceEvent(data),
);
```

This maps the message queue topic to the connection's handler method. See [Event Lifecycle](../understand/event-lifecycle.md#step-by-step) for the full dispatch flow.

## Step 5: Add configuration (if needed)

If your service needs global config (API keys, webhook secrets):

1. Create `src/config/sections/MyService.ts` with a config interface
2. Add the section to `BridgeConfigRoot` in `src/config/Config.ts`
3. Add to `config.sample.yml`
4. Document in [Configuration guide](../guides/operator/configuration.md)

## Step 6: Add provisioning support

For [widget UI](../reference/provisioning-api.md) and bot command support:

1. Add a setup command in `SetupConnection` (e.g., `!hookshot myservice add <url>`)
2. Implement `provisionConnection()` and `getProvisionerDetails()` on your class
3. Add UI components in `web/components/roomConfig/` for the widget

## Step 7: Add documentation

Follow the [integration template](../../doc/DOCUMENTATION_ARCHITECTURE.md):

1. Create `docs/integrations/myservice.md` with all required sections
2. Add to the [capability matrix](../integrations/overview.md)
3. Add to [Configuration guide](../guides/operator/configuration.md#service-configuration) service table
4. Add state event type to [Event Types reference](../reference/event-types.md)
5. Add bot commands to [Bot Commands reference](../reference/bot-commands.md) (auto-generated if using `@botCommand`)

## Step 8: Add tests

1. Unit tests for the connection class
2. Test webhook signature verification
3. Test message formatting
4. E2E test with Testcontainers (optional)

## Checklist

- [ ] Connection class with `IConnection` interface
- [ ] State event type registered
- [ ] Webhook route or polling service
- [ ] Message queue bindings in Bridge.ts
- [ ] Config section (if needed)
- [ ] Setup command in SetupConnection
- [ ] Widget UI component
- [ ] [Integration docs page](../integrations/overview.md)
- [ ] [Event types reference](../reference/event-types.md) updated
- [ ] Tests

## Examples to follow

| Complexity | Example | Why |
|---|---|---|
| Simplest webhook | [GenericHook](../integrations/generic-webhooks.md) | No auth, no commands, pure inbound |
| Simplest polling | [FeedConnection](../integrations/feeds.md) | No webhooks, Rust parser |
| Full featured | [GitHubRepoConnection](../integrations/github.md) | OAuth, commands, reactions, 23 events |
| With commands | [OpenProjectConnection](../integrations/openproject.md) | 5 bot commands, OAuth |

## Related

**Architecture:** [Connections](connections.md) · [Component Model](component-model.md) · [State and Storage](state-and-storage.md)

**Concepts:** [Integration Model](../understand/integration-model.md) · [Event Lifecycle](../understand/event-lifecycle.md)

**Reference:** [Event Types](../reference/event-types.md) · [Bot Commands](../reference/bot-commands.md) · [Provisioning API](../reference/provisioning-api.md)
