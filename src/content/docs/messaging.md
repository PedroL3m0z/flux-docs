---
title: Messaging
description: List chats, page through history, send text and media, and download attachments over the Flux HTTP API.
---

Once an instance is **`authorized`** (see [Sessions](/flux-docs/sessions/)), you
drive its Telegram account entirely over HTTP: list chats, read history, send
text and media, and pull attachment bytes. This page walks each operation with a
worked request and the shape it returns.

Every route below needs **both** auth headers and the instance's `chat:*` /
`message:*` / `media:*` permission:

```bash
-H 'Authorization: Bearer <JWT>' -H 'x-api-key: <API_KEY>'
```

`<id>` is the **instance** id; `<chatId>` is a chat id from the chat list. All
Telegram ids (`tgPeerId`, `tgMessageId`, …) cross the wire as **strings** —
they exceed JS number precision. Full shapes live in
[Types & contracts](/flux-docs/types/).

## List chats

`GET /telegram/instances/:id/chats` — returns the account's chats, **most recent
first**. No pagination; it lists the dialogs Telegram keeps in the account.

```bash
curl http://localhost:3000/telegram/instances/<id>/chats \
  -H 'Authorization: Bearer <JWT>' -H 'x-api-key: <API_KEY>'
```

```json
[
  {
    "id": "1a2b3c",
    "tgPeerId": "777000",
    "type": "user",
    "title": "Alice",
    "username": "alice",
    "hasPhoto": true,
    "lastMessageAt": "2026-06-26T10:15:00.000Z"
  },
  {
    "id": "4d5e6f",
    "tgPeerId": "-1001234567890",
    "type": "channel",
    "title": "Release notes",
    "hasPhoto": false
  }
]
```

`type` is `user`, `group` or `channel`. Use the `id` of the chat you want as
`<chatId>` in the routes below.

## Read history

`GET /telegram/instances/:id/chats/:chatId/messages` — returns messages
**newest-first**, cursor-paginated.

| Query | Type | Required | Description |
| --- | --- | :---: | --- |
| `cursor` | string | no | A message's `tgMessageId`; returns messages **older than** it (pages backwards) |
| `limit` | number | no | Page size (server-side default if omitted) |

First page (newest messages):

```bash
curl "http://localhost:3000/telegram/instances/<id>/chats/<chatId>/messages?limit=50" \
  -H 'Authorization: Bearer <JWT>' -H 'x-api-key: <API_KEY>'
```

```json
[
  {
    "id": "9f8e7d",
    "chatId": "1a2b3c",
    "tgMessageId": "10502",
    "text": "see you tomorrow",
    "outgoing": false,
    "date": "2026-06-26T10:15:00.000Z",
    "senderId": "777000",
    "sender": { "id": "777000", "name": "Alice", "username": "alice", "hasPhoto": true }
  },
  {
    "id": "1c2d3e",
    "chatId": "1a2b3c",
    "tgMessageId": "10498",
    "outgoing": false,
    "date": "2026-06-26T10:02:00.000Z",
    "media": { "type": "photo", "mimeType": "image/jpeg", "width": 1280, "height": 720 }
  }
]
```

To get the **next (older) page**, take the `tgMessageId` of the last (oldest)
message you received and pass it as `cursor`:

```bash
curl "http://localhost:3000/telegram/instances/<id>/chats/<chatId>/messages?cursor=10498&limit=50" \
  -H 'Authorization: Bearer <JWT>' -H 'x-api-key: <API_KEY>'
```

Repeat until you receive fewer than `limit` items — that's the start of the
chat. `text` is absent on media-only messages; `media` carries only **metadata**
(see [Download an attachment](#download-an-attachment)).

## Send a text message

`POST /telegram/instances/:id/chats/:chatId/messages` — body `{ text }`.

| Field | Type | Required | Rules |
| --- | --- | :---: | --- |
| `text` | string | yes | 1–4096 chars |

```bash
curl -X POST \
  http://localhost:3000/telegram/instances/<id>/chats/<chatId>/messages \
  -H 'Authorization: Bearer <JWT>' -H 'x-api-key: <API_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{"text":"Hello from Flux"}'
```

Returns the created `MessageView` with `outgoing: true` and the assigned
`tgMessageId`:

```json
{
  "id": "ab12cd",
  "chatId": "1a2b3c",
  "tgMessageId": "10503",
  "text": "Hello from Flux",
  "outgoing": true,
  "date": "2026-06-26T10:20:00.000Z"
}
```

## Send media

`POST /telegram/instances/:id/chats/:chatId/media` — **`multipart/form-data`**,
not JSON. One file per request, up to **50 MB**.

| Part | Type | Required | Rules |
| --- | --- | :---: | --- |
| `file` | file | yes | Photo, video or document — ≤ 50 MB |
| `caption` | string | no | ≤ 1024 chars |

```bash
curl -X POST \
  http://localhost:3000/telegram/instances/<id>/chats/<chatId>/media \
  -H 'Authorization: Bearer <JWT>' -H 'x-api-key: <API_KEY>' \
  -F 'file=@./photo.jpg' \
  -F 'caption=Holiday pic'
```

Note the `-F` flags (not `-d`) and `@` to upload a file. Telegram picks the kind
(photo / video / document) from the file. The response is the sent
`MessageView`, its `media` field describing the attachment:

```json
{
  "id": "ef34gh",
  "chatId": "1a2b3c",
  "tgMessageId": "10504",
  "text": "Holiday pic",
  "outgoing": true,
  "date": "2026-06-26T10:22:00.000Z",
  "media": { "type": "photo", "mimeType": "image/jpeg", "fileName": "photo.jpg", "width": 1280, "height": 720 }
}
```

## Download an attachment

Message media is **downloaded lazily**: a `MessageView` carries only `media`
metadata, never the bytes. Fetch the bytes only when you need them:

`GET /telegram/instances/:id/chats/:chatId/messages/:messageId/media` — streams
the raw bytes (`application/octet-stream`); `404` if the message has no media.

```bash
curl "http://localhost:3000/telegram/instances/<id>/chats/<chatId>/messages/<messageId>/media" \
  -H 'Authorization: Bearer <JWT>' -H 'x-api-key: <API_KEY>' \
  -o attachment.bin
```

Use the message `id` (or `tgMessageId`, per the route) of a message whose
`media.type` is not `none`. Pair the saved bytes with the `mimeType` / `fileName`
from the message's `media` metadata.

## Avatars

Chat and contact pictures stream as image bytes (`image/jpeg`); `404` when there
is none.

| Route | Returns |
| --- | --- |
| `GET …/chats/:chatId/photo` | Chat / group / channel avatar |
| `GET …/contacts/:contactId/photo` | Contact avatar |

```bash
curl "http://localhost:3000/telegram/instances/<id>/chats/<chatId>/photo" \
  -H 'Authorization: Bearer <JWT>' -H 'x-api-key: <API_KEY>' \
  -o avatar.jpg
```

`ChatView.hasPhoto` / `MessageSenderView.hasPhoto` tell you whether an avatar
exists before you fetch.

:::tip[Browser `<img>` / SSE can't set headers]
For media and avatar URLs loaded by the browser (or an `EventSource`), pass the
key as a query param instead of a header: `?apiKey=<API_KEY>`. The JWT cookie set
at login covers the Bearer side.
:::

## React in realtime

Polling history is fine for catch-up, but to **react as messages arrive**, don't
poll — stream them. New messages, edits, deletes, read receipts and reactions
push live over [Events (SSE)](/flux-docs/events/) or to your own endpoint via
[Webhooks](/flux-docs/webhooks/). Incoming `message.new` payloads are the same
`MessageView` shape shown above.
