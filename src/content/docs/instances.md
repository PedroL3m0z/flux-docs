---
title: Instances
description: Create, start, stop and use Telegram instances.
---

An **instance** is one Telegram account managed by Flux. You create it, authorize
it once (see [Sessions](/flux-docs/sessions/)), and then use it to read and send
messages. All routes below require a JWT + API key.

## Create

```bash
curl -X POST http://localhost:3000/telegram/instances \
  -H 'Authorization: Bearer <JWT>' -H 'x-api-key: <API_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{"label":"Main account"}'
```

| Field | Required | Notes |
| --- | --- | --- |
| `label` | yes | Human name (1–64 chars) |
| `engine` | no | Defaults to `gramjs` — see [Engines](/flux-docs/engines/) |
| `apiId` / `apiHash` | no | Override the global [credentials](/flux-docs/telegram-credentials/) |

The new instance starts in status `new` — it has no Telegram session yet.

## List, read & inspect

```bash
curl http://localhost:3000/telegram/instances -H ...          # list
curl http://localhost:3000/telegram/instances/<id> -H ...     # one instance
curl http://localhost:3000/telegram/instances/<id>/info -H ...# + live state
```

`/info` adds the live connection state and uptime:

```json
{ "id": "…", "label": "Main account", "status": "authorized",
  "username": "me", "connected": true, "uptimeSeconds": 1280 }
```

## Status values

| Status | Meaning |
| --- | --- |
| `new` | Created, never logged in |
| `connecting` | Establishing the connection |
| `awaiting_qr` / `awaiting_code` | Waiting for QR scan / phone code |
| `password_required` | Waiting for the 2FA password |
| `authorized` | Connected and usable |
| `disconnected` | Stopped, session kept |
| `error` | Session revoked/expired — log in again |

## Start & stop

`start` reconnects from the saved session; `stop` disconnects but keeps it.

```bash
curl -X POST http://localhost:3000/telegram/instances/<id>/start -H ...
curl -X POST http://localhost:3000/telegram/instances/<id>/stop  -H ...
```

## Delete

Removes the instance **and its session** (and cascades its chats/messages):

```bash
curl -X DELETE http://localhost:3000/telegram/instances/<id> -H ...   # 204
```

## Using an instance

Once `authorized`, work with its chats and messages:

| Action | Route |
| --- | --- |
| List chats | `GET …/instances/:id/chats` |
| List history (cursor) | `GET …/chats/:chatId/messages?cursor=&limit=` |
| Send text | `POST …/chats/:chatId/messages` `{ "text": "..." }` |
| Send media (≤50 MB) | `POST …/chats/:chatId/media` (multipart: `file`, `caption?`) |
| Download attachment | `GET …/messages/:messageId/media` |
| Chat / contact avatar | `GET …/chats/:chatId/photo`, `…/contacts/:contactId/photo` |

```bash
# Page backwards through history: pass the oldest id you received as the cursor
curl 'http://localhost:3000/telegram/instances/<id>/chats/<chatId>/messages?limit=50' -H ...

# Send a photo with a caption
curl -X POST http://localhost:3000/telegram/instances/<id>/chats/<chatId>/media \
  -H 'Authorization: Bearer <JWT>' -H 'x-api-key: <API_KEY>' \
  -F file=@photo.jpg -F caption='Look at this'
```

To get new messages in realtime, stream [Events](/flux-docs/events/) or use
[Webhooks](/flux-docs/webhooks/). For an account-wide health view, `GET
/telegram/stats` returns uptime and total/authorized/connected counts.
