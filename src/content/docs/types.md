---
title: Types & contracts
description: The request and response shapes Flux exposes — views, enums, event payloads and send-route bodies.
---

Flux normalizes Telegram's wire format into a small set of stable shapes. Two
rules hold everywhere:

- **int64 ids are strings.** Telegram ids (`tgPeerId`, `tgMessageId`, …) exceed
  JS number precision, so they cross the boundary as strings.
- **dates are ISO-8601 strings.** e.g. `2026-06-19T12:00:00.000Z`.

Every shape below also has a full JSON schema in the interactive
[`/docs`](http://localhost:3000/docs) (Scalar).

## Response views

```ts
interface InstanceView {
  id: string;
  label: string;
  engine: string;            // 'gramjs' | 'telegraf'
  status: InstanceStatus;
  firstName?: string;
  username?: string;
  phone?: string;
  apiId?: string;            // non-secret; api_hash is never exposed
  createdAt: string;
  myRole?: 'admin' | 'operator' | 'viewer';  // the requester's global role
}

// GET /instances/:id/info extends InstanceView with live state:
interface InstanceInfoView extends InstanceView {
  connected: boolean;
  uptimeSeconds?: number;
}

interface ChatView {
  id: string;
  tgPeerId: string;
  type: PeerType;            // 'user' | 'group' | 'channel'
  title?: string;
  username?: string;
  hasPhoto: boolean;
  lastMessageAt?: string;
}

interface MessageView {
  id: string;
  chatId: string;
  tgMessageId: string;
  text?: string;
  outgoing: boolean;
  date: string;
  senderId?: string;
  sender?: MessageSenderView;
  media?: MediaView;
}

interface MessageSenderView {
  id: string;
  name?: string;
  username?: string;
  hasPhoto: boolean;
}

interface MediaView {
  type: MediaType;           // see enum below
  mimeType?: string;
  fileName?: string;
  width?: number;
  height?: number;
  duration?: number;         // seconds, for audio/video
}
```

## Enums

| Enum | Values |
| --- | --- |
| `InstanceStatus` | `new`, `connecting`, `awaiting_qr`, `awaiting_code`, `password_required`, `authorized`, `disconnected`, `error` |
| `PeerType` | `user`, `group`, `channel` |
| `MediaType` | `none`, `photo`, `video`, `document`, `audio`, `sticker`, `other` |
| `Role` | `admin`, `operator`, `viewer` |
| `WebhookStatus` | `pending`, `success`, `failed`, `dead` |

Status meanings are in [Instances](/flux-docs/instances/); roles in
[Accounts](/flux-docs/accounts/).

## Auth shapes

```ts
interface UserEntity   { id: string; email: string; username: string; role: Role }  // never exposes the hash
interface LoginResponse { accessToken: string }   // the JWT; also set as an httpOnly cookie
```

## Webhook shapes

```ts
interface WebhookView {
  id: string;
  name: string;
  url: string;
  active: boolean;
  allowInternal: boolean;    // deliver to private/loopback targets (default false)
  events: string[];          // subscribed event types
  instanceIds: string[];     // linked instances (M2M)
  createdAt: string;
  updatedAt: string;
}

interface WebhookWithSecret extends WebhookView {
  secret: string;            // only on create / regenerate-secret, returned once
}

interface WebhookDeliveryView {
  id: string;
  webhookId: string;
  instanceId?: string;
  event: string;
  status: WebhookStatus;
  attempts: number;
  statusCode?: number;
  lastError?: string;
  responseBody?: string;     // target's response, truncated to ~2000 chars
  nextAttemptAt: string;     // when the next retry is due (while pending/failed)
  createdAt: string;
  deliveredAt?: string;
}
```

Retry backoff is `10s → 1m → 5m → 30m → 2h`; after **6 attempts** a delivery
becomes `dead`. See [Webhooks](/flux-docs/webhooks/) for the signed POST body and
headers.

## Event payloads

Realtime events (over [SSE or webhooks](/flux-docs/events/)) share a `DomainEvent`
envelope:

```ts
interface DomainEvent {
  instanceId: string;
  type: EventType;
  at: string;                // ISO timestamp
  payload: Record<string, unknown>;
}
```

The `payload` shape depends on `type`:

| `type` | Payload |
| --- | --- |
| `session.status` | `{ status: InstanceStatus, username?, phone? }` |
| `message.new` | `MessageView` |
| `message.edited` | `MessageView` |
| `message.deleted` | `{ chat?, tgMessageIds: string[] }` |
| `message.read` | `{ chat, maxId, direction: 'inbound' \| 'outbound' }` |
| `message.reaction` | `{ chat, tgMessageId, reactions: { emoji?, customEmojiId?, count }[] }` |

In `message.read`, `direction: 'outbound'` means the recipient read **your**
message (the classic "seen"); `'inbound'` means you read theirs.

## Request bodies (send routes)

```ts
// POST /telegram/instances/:id/chats/:chatId/messages
interface SendMessageBody { text: string }            // 1–4096 chars

// POST /telegram/instances/:id/chats/:chatId/media   (multipart/form-data)
//   file:    the attachment (≤ 50 MB)
//   caption: optional, ≤ 1024 chars

// POST /telegram/instances
interface CreateInstanceBody {
  label: string;            // 1–64 chars
  engine?: 'gramjs' | 'telegraf';   // default 'gramjs'
  apiId?: string;           // override the global credentials
  apiHash?: string;
}

// Login bodies
interface PhoneBody    { phone: string }   // +international, e.g. +5511999999999
interface CodeBody     { code: string }    // 5–6 digits
interface PasswordBody { password: string }  // Telegram 2FA password
```

Media bytes are **downloaded lazily**: a `MessageView` carries only `media`
metadata; fetch the bytes from
`GET …/chats/:chatId/messages/:messageId/media` when you need them.
