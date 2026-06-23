---
title: Sessions
description: Authorize an account via QR or phone + 2FA, and keep it connected.
---

A **session** is the saved credential that keeps an instance logged in to
Telegram. You create one by completing a login flow once; Flux then persists it
(encrypted) and reconnects automatically on restart.

There are two ways to log in: **QR code** or **phone number**. Both end in
`authorized`.

## QR login

Open the QR stream (Server-Sent Events) and render each `qr` url as a QR code for
the user to scan in their Telegram app:

```bash
curl -N http://localhost:3000/telegram/instances/<id>/login/qr \
  -H 'Authorization: Bearer <JWT>' -H 'x-api-key: <API_KEY>'
```

The stream emits, in order:

| Event | Meaning |
| --- | --- |
| `{ "type": "qr", "url": "tg://login?token=…", "expires": 30 }` | Show this as a QR; it refreshes periodically |
| `{ "type": "password_required" }` | The account has 2FA — submit the password (below) |
| `{ "type": "authorized", "me": { … } }` | Done — the instance is connected |
| `{ "type": "error", "message": "…" }` | Login failed |

If you get `password_required`, submit the 2FA password:

```bash
curl -X POST http://localhost:3000/telegram/instances/<id>/login/password \
  -H 'Authorization: Bearer <JWT>' -H 'x-api-key: <API_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{"password":"my-2fa-password"}'
```

## Phone login

1. **Start** — Telegram sends a code to the account's app/SMS:

```bash
curl -X POST http://localhost:3000/telegram/instances/<id>/login/phone \
  -H 'Authorization: Bearer <JWT>' -H 'x-api-key: <API_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+5511999999999"}'
```

2. **Submit the code** — returns the next step:

```bash
curl -X POST http://localhost:3000/telegram/instances/<id>/login/code \
  -H 'Authorization: Bearer <JWT>' -H 'x-api-key: <API_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{"code":"12345"}'
# → { "status": "authorized", "me": { … } }
#   or { "status": "password_required" }
```

3. **2FA (if required)** — submit the password at the same
`/login/password` endpoint as above.

## Persistence & reconnection

- The session string is stored in Redis, **encrypted at rest** (AES-256-GCM).
- On startup, every authorized instance is rehydrated and reconnected.
- A periodic health check detects sessions **revoked remotely** (e.g. you ended
  the session from the Telegram app). When that happens the instance moves to
  `error` and clears its session — just log in again.

## Stop vs. log out

- `POST …/instances/:id/stop` disconnects but **keeps** the session (resume later
  with `start`).
- `DELETE …/instances/:id` removes the instance **and** its session.

See [Instances](/flux-docs/instances/) for start/stop/delete and status values.
