---
title: Getting started
description: Run Flux and connect your first Telegram account in minutes.
---

This page takes you from nothing to a connected account sending a message. Each step links to its full guide.

## 1. Run the gateway

```bash
git clone https://github.com/PedroL3m0z/Flux-Api.git
cd flux-api
docker compose up -d
```

| Surface | URL |
| --- | --- |
| API | `http://localhost:3000` |
| Dashboard | `http://localhost:3000/dashboard` |
| Interactive API docs (Scalar) | `http://localhost:3000/docs` |

:::tip[Zero configuration]
No environment variables are required. On first boot Flux generates strong
secrets and an initial **admin** user, printing the **API key** and the admin
**password** to the log **once** — copy them now. They are also stored in
`data/secrets.json`.
:::

## 2. Log in

Every protected request needs two things: a **JWT** (who you are) and the
**API key** (`x-api-key`). Get the JWT by logging in:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"<from the boot log>"}'
# → { "accessToken": "<JWT>" }
```

See [Authentication](/flux-docs/authentication/) for the full picture.

## 3. Set your Telegram credentials

Flux talks to Telegram with an `api_id` / `api_hash` from
[my.telegram.org](https://my.telegram.org):

```bash
curl -X PUT http://localhost:3000/telegram/settings \
  -H 'Authorization: Bearer <JWT>' \
  -H 'x-api-key: <API_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{"apiId":"123456","apiHash":"abcdef..."}'
```

More in [Telegram credentials](/flux-docs/telegram-credentials/).

## 4. Create an instance

```bash
curl -X POST http://localhost:3000/telegram/instances \
  -H 'Authorization: Bearer <JWT>' -H 'x-api-key: <API_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{"label":"Main account"}'
# → { "id": "<instanceId>", "status": "new", ... }
```

See [Instances](/flux-docs/instances/).

## 5. Authorize it (log in to Telegram)

Open a QR login stream and scan the code with your phone, or log in by phone
number + code. Full flows in [Sessions](/flux-docs/sessions/).

## 6. Send a message

```bash
curl -X POST \
  http://localhost:3000/telegram/instances/<instanceId>/chats/<chatId>/messages \
  -H 'Authorization: Bearer <JWT>' -H 'x-api-key: <API_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{"text":"Hello from Flux"}'
```

From here, subscribe to [Webhooks](/flux-docs/webhooks/) or stream
[Events](/flux-docs/events/) to react to incoming messages.

## Prefer the dashboard?

Everything above is also point-and-click at `http://localhost:3000/dashboard`:
log in, set credentials in **Settings**, create an instance, connect it via QR
or phone, and open its chats.
