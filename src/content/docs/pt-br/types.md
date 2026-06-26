---
title: Tipos e contratos
description: Os formatos de request e response que a Flux expõe — views, enums, payloads de evento e corpos das rotas de envio.
---

A Flux normaliza o formato de fio do Telegram num pequeno conjunto de formatos
estáveis. Duas regras valem em todo lugar:

- **ids int64 são strings.** Os ids do Telegram (`tgPeerId`, `tgMessageId`, …)
  excedem a precisão de número do JS, então cruzam a fronteira como strings.
- **datas são strings ISO-8601.** ex.: `2026-06-19T12:00:00.000Z`.

Cada formato abaixo também tem um JSON schema completo nas docs interativas
[`/docs`](http://localhost:3000/docs) (Scalar).

## Views de resposta

```ts
interface InstanceView {
  id: string;
  label: string;
  engine: string;            // 'gramjs' | 'telegraf'
  status: InstanceStatus;
  firstName?: string;
  username?: string;
  phone?: string;
  apiId?: string;            // não-secreto; api_hash nunca é exposto
  createdAt: string;
  myRole?: 'admin' | 'operator' | 'viewer';  // o papel global do requisitante
}

// GET /instances/:id/info estende InstanceView com estado ao vivo:
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
  type: MediaType;           // veja o enum abaixo
  mimeType?: string;
  fileName?: string;
  width?: number;
  height?: number;
  duration?: number;         // segundos, para áudio/vídeo
}
```

## Enums

| Enum | Valores |
| --- | --- |
| `InstanceStatus` | `new`, `connecting`, `awaiting_qr`, `awaiting_code`, `password_required`, `authorized`, `disconnected`, `error` |
| `PeerType` | `user`, `group`, `channel` |
| `MediaType` | `none`, `photo`, `video`, `document`, `audio`, `sticker`, `other` |
| `Role` | `admin`, `operator`, `viewer` |
| `WebhookStatus` | `pending`, `success`, `failed`, `dead` |

Os significados dos status estão em [Instâncias](/flux-docs/pt-br/instances/); os papéis em
[Contas](/flux-docs/pt-br/accounts/).

## Formatos de auth

```ts
interface UserEntity   { id: string; email: string; username: string; role: Role }  // nunca expõe o hash
interface LoginResponse { accessToken: string }   // o JWT; também definido como cookie httpOnly
```

## Formatos de webhook

```ts
interface WebhookView {
  id: string;
  name: string;
  url: string;
  active: boolean;
  allowInternal: boolean;    // entrega a destinos privados/loopback (padrão false)
  events: string[];          // tipos de evento assinados
  instanceIds: string[];     // instâncias vinculadas (M2M)
  createdAt: string;
  updatedAt: string;
}

interface WebhookWithSecret extends WebhookView {
  secret: string;            // só em create / regenerate-secret, retornado uma vez
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
  responseBody?: string;     // resposta do destino, truncada a ~2000 chars
  nextAttemptAt: string;     // quando a próxima retentativa está marcada (enquanto pending/failed)
  createdAt: string;
  deliveredAt?: string;
}
```

O backoff de retentativa é `10s → 1m → 5m → 30m → 2h`; após **6 tentativas** uma
entrega vira `dead`. Veja [Webhooks](/flux-docs/pt-br/webhooks/) para o corpo do POST
assinado e os headers.

## Payloads de evento

Eventos em tempo real (via [SSE ou webhooks](/flux-docs/pt-br/events/)) compartilham um
envelope `DomainEvent`:

```ts
interface DomainEvent {
  instanceId: string;
  type: EventType;
  at: string;                // timestamp ISO
  payload: Record<string, unknown>;
}
```

O formato de `payload` depende do `type`:

| `type` | Payload |
| --- | --- |
| `session.status` | `{ status: InstanceStatus, username?, phone? }` |
| `message.new` | `MessageView` |
| `message.edited` | `MessageView` |
| `message.deleted` | `{ chat?, tgMessageIds: string[] }` |
| `message.read` | `{ chat, maxId, direction: 'inbound' \| 'outbound' }` |
| `message.reaction` | `{ chat, tgMessageId, reactions: { emoji?, customEmojiId?, count }[] }` |

Em `message.read`, `direction: 'outbound'` significa que o destinatário leu **sua**
mensagem (o clássico "visto"); `'inbound'` significa que você leu a dele.

## Corpos de request (rotas de envio)

```ts
// POST /telegram/instances/:id/chats/:chatId/messages
interface SendMessageBody { text: string }            // 1–4096 caracteres

// POST /telegram/instances/:id/chats/:chatId/media   (multipart/form-data)
//   file:    o anexo (≤ 50 MB)
//   caption: opcional, ≤ 1024 caracteres

// POST /telegram/instances
interface CreateInstanceBody {
  label: string;            // 1–64 caracteres
  engine?: 'gramjs' | 'telegraf';   // padrão 'gramjs'
  apiId?: string;           // sobrescreve as credenciais globais
  apiHash?: string;
}

// Corpos de login
interface PhoneBody    { phone: string }   // +internacional, ex.: +5511999999999
interface CodeBody     { code: string }    // 5–6 dígitos
interface PasswordBody { password: string }  // senha 2FA do Telegram
```

Os bytes de mídia são **baixados sob demanda**: um `MessageView` carrega só os
metadados de `media`; busque os bytes em
`GET …/chats/:chatId/messages/:messageId/media` quando precisar.
