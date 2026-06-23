---
title: Engines
description: The Telegram backends an instance can run on.
---

An **engine** is the backend that actually talks to Telegram for an instance.
Flux is engine-agnostic: each instance picks one via its `engine` field, and the
rest of the API (sessions, messages, events, webhooks) behaves the same
regardless of which engine is used.

## Available engines

| Engine | `key` | Status | What it supports | Login |
| --- | --- | --- | --- | --- |
| **GramJS** | `gramjs` | ✅ available | full messaging (read/send/receive) | QR + 2FA, phone |
| Telegraf | `telegraf` | 🔜 reserved | bot-token (planned) | Bot token |

`gramjs` is the default and runs **user accounts** over MTProto — it's what you
want for connecting a personal/business number.

## Choosing an engine

Pass `engine` when creating an instance (it defaults to `gramjs`):

```bash
curl -X POST http://localhost:3000/telegram/instances \
  -H 'Authorization: Bearer <JWT>' -H 'x-api-key: <API_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{"label":"Main account","engine":"gramjs"}'
```

Requesting an engine that isn't available returns `400 Bad Request`.

## Capabilities

Each engine declares what it can do — for example QR login and messaging. The API
only exposes actions an engine actually supports, so a flow like QR login is
available when the engine advertises that capability. GramJS advertises QR login
and full messaging; the reserved Telegraf engine targets the Bot API.

:::note[For integrators]
New engines are added by implementing the engine contract and registering it —
no change to instances, sessions, events or webhooks. From a user's perspective,
a new engine simply appears as another `key` you can select.
:::
