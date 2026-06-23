---
title: Telegram credentials
description: Set the api_id / api_hash that power the Telegram layer.
---

Flux connects to Telegram over MTProto, which requires an **`api_id`** and
**`api_hash`**. Without them, the Telegram endpoints return `503 Service
Unavailable`.

## Get your api_id / api_hash

1. Sign in at [my.telegram.org](https://my.telegram.org).
2. Open **API development tools**.
3. Create an app — you'll get an `api_id` (a number) and an `api_hash` (a string).

## Set them globally

These become the default for every instance:

```bash
curl -X PUT http://localhost:3000/telegram/settings \
  -H 'Authorization: Bearer <JWT>' -H 'x-api-key: <API_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{"apiId":"123456","apiHash":"0123456789abcdef0123456789abcdef"}'
```

Read them back (the **hash is never returned** — only whether one is set):

```bash
curl http://localhost:3000/telegram/settings \
  -H 'Authorization: Bearer <JWT>' -H 'x-api-key: <API_KEY>'
```

```json
{ "apiId": 123456, "hasApiHash": true }
```

You can also set these from the dashboard under **Settings**, or at startup with
the `TELEGRAM_API_ID` / `TELEGRAM_API_HASH` environment variables.

## Override per instance

Provide `apiId` / `apiHash` when creating an [instance](/flux-docs/instances/) to
override the global values for that account only:

```bash
curl -X POST http://localhost:3000/telegram/instances \
  -H 'Authorization: Bearer <JWT>' -H 'x-api-key: <API_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{"label":"Secondary","apiId":"654321","apiHash":"..."}'
```

The effective credentials for an instance are the **global settings merged with
its per-instance overrides**.

:::caution[Stored encrypted]
The `api_hash` is encrypted at rest (AES-256-GCM) and never leaves the server.
Treat your `api_id` / `api_hash` like passwords.
:::
