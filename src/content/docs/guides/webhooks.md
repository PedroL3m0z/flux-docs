---
title: Webhooks
description: Subscribe to Telegram events with durable, signed, retried delivery.
---

A **webhook** subscribes to a subset of event types and is linked to one or more instances (a many-to-many relationship). When an event matches `linked instance ∩ subscribed type ∩ active webhook`, a delivery is queued and POSTed to your URL.

## Delivery guarantees

- **Durable** — each attempt is a `WebhookDelivery` row in Postgres (survives restarts).
- **Retry with backoff** — `10s → 1m → 5m → 30m → 2h`; after **6 attempts** the delivery becomes `dead`.
- **Signed** — body signed with HMAC-SHA256; verify before trusting.
- **Auditable** — status, HTTP code, attempt count and last error are queryable (`GET /webhooks/:id/deliveries`), with manual resend.
- **SSRF-guarded** — URLs targeting localhost, private/reserved ranges or cloud metadata are rejected at create time and re-checked (with DNS resolution) before each delivery.

## Request body

```json
{
  "event": "message.new",
  "instanceId": "ckinst0001",
  "at": "2026-06-19T12:00:00.000Z",
  "data": { "...": "event payload (e.g. MessageView)" }
}
```

## Headers

| Header | Content |
| --- | --- |
| `Content-Type` | `application/json` |
| `User-Agent` | `Flux-Webhooks/1.0` |
| `X-Flux-Event` | event type (e.g. `message.new`) |
| `X-Flux-Delivery` | delivery id (idempotency) |
| `X-Flux-Instance` | source instance id (when applicable) |
| `X-Flux-Signature` | `sha256=<hmac-hex>` of the raw body, using the webhook `secret` |

## Verifying the signature

The `secret` (prefix `whsec_`) is returned **only once** when creating or rotating the webhook. Sign the **raw** body and compare in constant time:

```ts
import { createHmac, timingSafeEqual } from 'node:crypto';

function verify(rawBody: string, header: string, secret: string): boolean {
  const expected = `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`;
  const a = Buffer.from(expected);
  const b = Buffer.from(header);
  return a.length === b.length && timingSafeEqual(a, b);
}
```

## Managing webhooks

Create with `POST /webhooks` — `{ name, url, events[], instanceIds? }` — and the response includes the `secret` once. Update with `PATCH /webhooks/:id`, link/unlink instances with `POST|DELETE /webhooks/:id/instances/:instanceId`, inspect the log with `GET /webhooks/:id/deliveries`, and re-queue a single attempt with `POST /webhooks/deliveries/:deliveryId/resend`. See [Endpoints](/flux-docs/reference/endpoints/) for the full list.
