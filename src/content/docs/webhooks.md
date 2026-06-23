---
title: Webhooks
description: Receive Telegram events on your own endpoint — signed and retried.
---

A **webhook** delivers events to a URL you own. You subscribe it to a subset of
[event types](/flux-docs/events/) and link it to one or more
[instances](/flux-docs/instances/); whenever a matching event happens, Flux POSTs
it to your endpoint with retries and an HMAC signature.

## Create a webhook

```bash
curl -X POST http://localhost:3000/webhooks \
  -H 'Authorization: Bearer <JWT>' -H 'x-api-key: <API_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "My integration",
    "url": "https://example.com/hooks/flux",
    "events": ["message.new", "message.read"],
    "instanceIds": ["<instanceId>"]
  }'
```

The response includes the signing **`secret`** (prefix `whsec_`) **once** — store
it now; it is never shown again. List the subscribable types with
`GET /webhooks/event-types`.

## Receiving a delivery

Flux sends a `POST` with this body:

```json
{
  "event": "message.new",
  "instanceId": "<instanceId>",
  "at": "2026-06-19T12:00:00.000Z",
  "data": { "...": "the event payload, e.g. a message" }
}
```

And these headers:

| Header | Content |
| --- | --- |
| `Content-Type` | `application/json` |
| `User-Agent` | `Flux-Webhooks/1.0` |
| `X-Flux-Event` | event type (e.g. `message.new`) |
| `X-Flux-Delivery` | delivery id — use it for idempotency |
| `X-Flux-Instance` | source instance id (when applicable) |
| `X-Flux-Signature` | `sha256=<hmac-hex>` of the raw body, using the webhook `secret` |

## Verify the signature

Always verify before trusting a delivery. Sign the **raw** body with your secret
and compare in constant time:

```ts
import { createHmac, timingSafeEqual } from 'node:crypto';

function verify(rawBody: string, header: string, secret: string): boolean {
  const expected = `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`;
  const a = Buffer.from(expected);
  const b = Buffer.from(header);
  return a.length === b.length && timingSafeEqual(a, b);
}
```

## Delivery guarantees

- **Durable** — every attempt is stored, surviving restarts.
- **Retried with backoff** — `10s → 1m → 5m → 30m → 2h`; after 6 attempts a
  delivery is marked `dead`.
- **Auditable** — inspect the log and re-send manually (below).

## Manage

| Action | Route |
| --- | --- |
| List your webhooks | `GET /webhooks` |
| Get one | `GET /webhooks/:id` |
| Update (name, url, active, events) | `PATCH /webhooks/:id` |
| Delete | `DELETE /webhooks/:id` |
| Rotate the secret (returned once) | `POST /webhooks/:id/regenerate-secret` |
| Link / unlink an instance | `POST` / `DELETE /webhooks/:id/instances/:instanceId` |
| Delivery log (`?limit=`, default 50) | `GET /webhooks/:id/deliveries` |
| Re-queue a delivery now | `POST /webhooks/deliveries/:deliveryId/resend` |

:::caution[Public URLs only]
Webhook URLs that point at localhost, private/reserved IP ranges or cloud
metadata are rejected when you create or update the webhook, and re-checked
(with DNS resolution) before each delivery. Use a publicly reachable HTTPS URL.
:::
