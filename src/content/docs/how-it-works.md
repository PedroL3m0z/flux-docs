---
title: How it works
description: The path a Telegram update takes through Flux — from MTProto to your endpoint.
---

Flux sits between Telegram and you. An account connects through an **engine**,
every update is normalized into an **event**, and that event fans out to whoever
is listening — a live SSE stream and/or durable webhooks. This page follows one
update end to end.

![How an update flows through Flux: Telegram → Engine → sync → event bus → SSE / webhooks → your endpoint](../../assets/schema.png)

## The pipeline, step by step

### 1. Telegram → Engine

Each [instance](/flux-docs/instances/) holds a live connection to Telegram over
**MTProto**, run by its [engine](/flux-docs/engines/) (GramJS by default). The
engine receives raw updates — new messages, edits, reads, reactions — as they
happen.

### 2. Engine → TelegramSyncService

Raw updates hit the **sync service**, which does two things on every event:

- **persists** the message/chat into Postgres (so history and media survive
  restarts), and
- **publishes** a normalized [event](/flux-docs/events/) onward.

This is where Telegram's wire format becomes Flux's stable shapes
(`MessageView`, `ChatView`, …) — see [Types & contracts](/flux-docs/types/).

### 3. TelegramEventBus (RxJS Subject)

Every normalized event — plus `session.status` transitions emitted by the
**TelegramManager** when an instance connects, drops or is revoked — is published
to a single in-process **event bus** as a `DomainEvent` envelope
(`instanceId`, `type`, `at`, `payload`). The bus is the one fan-out point; nothing
downstream talks to the engine directly.

### 4. Fan-out: SSE + webhooks

Two consumers subscribe to the bus:

- **SSE stream** (`/messages/stream`, `/status/stream`) — pushes events to any
  connected client in realtime. Great for live dashboards; not durable (you only
  get events while connected). See [Events](/flux-docs/events/).
- **Webhook Dispatcher** — for each event, finds the [webhooks](/flux-docs/webhooks/)
  subscribed to that type and linked to that instance, and **creates a
  `WebhookDelivery`** row.

### 5. Webhook delivery (durable outbox)

Deliveries are written to Postgres as an **outbox** — so they survive restarts and
are auditable. A **Delivery Worker** then picks them up and `POST`s to your
endpoint, **signed with HMAC** (`X-Flux-Signature`) and **retried with backoff**
(`10s → 1m → 5m → 30m → 2h`; `dead` after 6 attempts).

### 6. → Your endpoint

You receive a signed `POST`. [Verify the signature](/flux-docs/webhooks/#verify-the-signature),
de-duplicate on `X-Flux-Delivery`, and act on the payload.

## Why this shape

- **One bus, many consumers.** Adding a new way to consume events (a new stream,
  a new sink) means subscribing to the bus — the engine and sync layer don't
  change.
- **Engine-agnostic.** Everything after step 2 works on normalized events, so a
  new [engine](/flux-docs/engines/) plugs in without touching events or webhooks.
- **Durable where it matters.** SSE is best-effort for live UIs; webhooks go
  through the Postgres outbox so backend integrations get at-least-once,
  replayable delivery.

Ready to drive it? Start at [Getting started](/flux-docs/getting-started/), or
jump to [Events](/flux-docs/events/) and [Webhooks](/flux-docs/webhooks/).
