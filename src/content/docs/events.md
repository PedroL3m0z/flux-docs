---
title: Events
description: The event types and how to stream them in realtime.
---

Every instance emits **normalized events** when something happens — a new
message, an edit, a read receipt, a status change. You can consume them two ways:
a realtime **SSE stream**, or durable [**webhooks**](/flux-docs/webhooks/).

## Event types

| Type | Fires when | Payload (summary) |
| --- | --- | --- |
| `session.status` | An instance connects, disconnects, errors or is revoked | `{ status, username?, phone? }` |
| `message.new` | A message is received or sent | the message |
| `message.edited` | A message is edited | the message |
| `message.deleted` | One or more messages are deleted | `{ chat?, tgMessageIds[] }` |
| `message.read` | A read receipt ("seen") | `{ chat, maxId, direction }` |
| `message.reaction` | A reaction is added or removed | `{ chat, tgMessageId, reactions[] }` |

:::note[Read direction]
In `message.read`, `direction: "outbound"` means the recipient read **your**
message (the classic "seen"); `"inbound"` means you read theirs.
:::

## Stream over SSE

Open a Server-Sent Events connection and process each `data` payload as it
arrives. New messages for one instance:

```bash
curl -N http://localhost:3000/telegram/instances/<id>/messages/stream \
  -H 'Authorization: Bearer <JWT>' -H 'x-api-key: <API_KEY>'
```

Session status across **all** instances:

```bash
curl -N http://localhost:3000/telegram/instances/status/stream \
  -H 'Authorization: Bearer <JWT>' -H 'x-api-key: <API_KEY>'
```

From a browser, `EventSource` can't set headers — pass the key in the query
string instead:

```js
const es = new EventSource(
  'http://localhost:3000/telegram/instances/ID/messages/stream?apiKey=API_KEY',
);
es.onmessage = (e) => console.log(JSON.parse(e.data));
```

## SSE vs. webhooks

| | SSE | Webhooks |
| --- | --- | --- |
| Direction | Server → connected client | Server → your URL |
| Best for | Live dashboards, in-app realtime | Backend integrations, automation |
| Delivery | While connected (not durable) | Durable, retried, signed |
| Event scope | Messages + status streams | Any subset of types you subscribe |

Use SSE for a UI that's open; use [webhooks](/flux-docs/webhooks/) when you need
guaranteed, replayable delivery to a server.
