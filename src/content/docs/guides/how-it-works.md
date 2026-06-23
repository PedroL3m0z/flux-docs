---
title: How it works
description: The path of a message, from Telegram to your system.
---

A message travels through Flux end to end like this:

```
                  ┌─────────────────────────────────────────────────────────┐
   Telegram       │                        Flux API                          │
  (MTProto)       │                                                          │
      │           │   ┌──────────┐   onEvent   ┌──────────────────┐         │
      │  updates   │   │  Engine  │ ──────────► │ TelegramSync     │         │
      ├───────────►│   │ (GramJS) │             │ Service          │         │
      │           │   └──────────┘             │  • persists msg  │         │
      │           │                            │  • publishes evt │         │
      │           │                            └────────┬─────────┘         │
      │           │                                     │ DomainEvent       │
      │           │                            ┌────────▼─────────┐         │
      │           │   session.status ─────────►│ TelegramEventBus │         │
      │           │   (TelegramManager)        │   (RxJS Subject) │         │
      │           │                            └───┬──────────┬───┘         │
      │           │                                │          │             │
      │           │              ┌─────────────────▼──┐   ┌───▼───────────┐ │
      │           │              │ SSE stream         │   │ Webhook        │ │
      │           │              │ (/messages/stream) │   │ Dispatcher     │ │
      │           │              └────────────────────┘   └───┬───────────┘ │
      │           │                                           │ creates     │
      │           │                                  ┌────────▼─────────┐   │
      │           │                                  │ WebhookDelivery  │   │
      │           │                                  │ (Postgres outbox)│   │
      │           │                                  └────────┬─────────┘   │
      │           │                                  ┌────────▼─────────┐   │
      │           │                                  │ Delivery Worker  │───┼──► your endpoint
      │           │                                  │ (POST+HMAC+retry)│   │
      │           │                                  └──────────────────┘   │
      └───────────┘                                                          │
                  └─────────────────────────────────────────────────────────┘
```

1. **Connection** — The `TelegramManager` resolves the instance's **engine** (e.g. GramJS), connects using the session saved in Redis and, if needed, drives the QR/2FA login.
2. **Capture** — The engine subscribes to Telegram updates and normalizes them into an engine-agnostic `NormalizedEvent`, delivered via `onEvent`.
3. **Sync** — The `TelegramSyncService` persists new/edited messages in Postgres and publishes a `DomainEvent` on the bus. The `TelegramManager` publishes `session.status` on lifecycle transitions.
4. **Fan-out** — The `TelegramEventBus` (RxJS) distributes the event to two consumers: the **SSE stream** and the **WebhookDispatcher**.
5. **Durable delivery** — The dispatcher creates a `WebhookDelivery` row (outbox) per matching webhook (linked instance ∩ subscribed type ∩ active). A **worker** drains the queue, signs the body with HMAC and POSTs it, with retry/backoff and a persisted log.

## Engines

An **engine** is a pluggable adapter that knows how to connect and operate an account on a specific Telegram library. The `TelegramManager` stays agnostic and delegates to the engine resolved by the instance's `engine` field.

| Engine | `key` | Status | Capabilities | Login |
| --- | --- | --- | --- | --- |
| **GramJS** | `gramjs` | ✅ implemented | `qrLogin`, `messaging` | QR + 2FA |
| Telegraf | `telegraf` | 🔜 reserved | `botToken` (planned) | Bot token |

Adding a new engine means implementing the `InstanceEngine` contract and registering it — nothing in the manager changes. Each engine normalizes native types into engine-agnostic shapes (`NormalizedChat`, `NormalizedMessage`, `NormalizedEvent`, …) so sync, SSE and webhooks behave identically regardless of engine.
