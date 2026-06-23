---
title: Events
description: The normalized event system and how to consume it.
---

Instances emit normalized events, distributed in-process by the `TelegramEventBus`. A `DomainEvent` has the shape:

```ts
interface DomainEvent {
  instanceId: string;
  type: EventType;
  at: string;                      // ISO timestamp
  payload: Record<string, unknown>;
}
```

## Event types

| Type | When it fires | Payload (summary) |
| --- | --- | --- |
| `session.status` | Instance lifecycle transition | `{ status, username?, phone? }` |
| `message.new` | New message received/sent (persisted, sent to SSE) | `MessageView` |
| `message.edited` | Message edited (persisted) | `MessageView` |
| `message.deleted` | Message(s) deleted | `{ chat?, tgMessageIds[] }` |
| `message.read` | Read receipt ("seen") | `{ chat, maxId, direction }` |
| `message.reaction` | Reaction added/removed | `{ chat, tgMessageId, reactions[] }` |

:::note
In `message.read`, `direction: 'outbound'` means the recipient read **your**
message (the classic "seen"); `'inbound'` means you read their messages.
:::

## Two ways to consume

- **SSE** — `GET /telegram/instances/:id/messages/stream`, focused on `message.new`. There is also `GET /telegram/instances/status/stream` for status transitions across all instances.
- **Webhooks** — subscribe to any subset of types with durable, signed delivery. See [Webhooks](/flux-docs/guides/webhooks/).

SSE streams are browser-friendly: because `EventSource` cannot set headers, the API key may be passed as an `?apiKey=` query parameter.
