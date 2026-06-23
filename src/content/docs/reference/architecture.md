---
title: Architecture
description: How the codebase is organized and the principles behind it.
---

The code separates **core** (reusable domain/infra) from **modules** (the HTTP surface).

```
src/
├── core/                       # domain + infrastructure (no HTTP route)
│   ├── prisma/                 # schema, migrations, PrismaService
│   ├── redis/                  # Redis client (sessions)
│   ├── telegram/               # engines, manager, sync, event bus, views
│   └── webhooks/               # service, dispatcher, worker, signing
└── modules/                    # controllers + DTOs + entities (OpenAPI)
    ├── auth/                   # login, JWT, API key
    ├── users/                  # dashboard users
    ├── telegram/               # instances, chats, messages, media, SSE
    ├── webhooks/               # webhook CRUD, links, deliveries
    ├── health/                 # healthchecks (Terminus)
    └── dashboard/              # redirect / → /dashboard
```

## Principles

- **Core knows nothing about HTTP.** Controllers in `modules` inject services from `core`.
- **In-process pub/sub.** Events travel over an RxJS `Subject` (`TelegramEventBus`) — Redis is used only for sessions; no external queue (BullMQ) is required.
- **Postgres outbox.** Webhook durability comes from the `WebhookDelivery` table (queue + audit log), drained by an interval worker.
- **Typed boundary.** Telegram int64 ids (BigInt) become **strings**; dates are **ISO-8601**. `*View` types are the shapes exposed to clients; Prisma models never leak secrets.

## Data model (Prisma)

Core entities: `User`, `Instance`, `Contact`, `Chat`, `Message`, `Setting`, `Webhook`, `WebhookInstance` (M2M link), and `WebhookDelivery` (outbox + log). Instances cascade-delete their chats, contacts, messages and webhook links.

## API contracts

The shapes exposed to clients (ISO dates, int64 as string) all have a full schema at `/docs`:

```ts
interface InstanceView { id; label; engine; status; firstName?; username?; phone?; apiId?; createdAt }
interface ChatView     { id; tgPeerId; type; title?; username?; hasPhoto; lastMessageAt? }
interface MessageView  { id; chatId; tgMessageId; text?; outgoing; date; senderId?; sender?; media? }
interface MediaView    { type; mimeType?; fileName?; width?; height?; duration? }
type     InstanceStatus = 'new'|'connecting'|'awaiting_qr'|'awaiting_code'|'password_required'|'authorized'|'disconnected'|'error'

interface WebhookView         { id; name; url; active; events[]; instanceIds[]; createdAt; updatedAt }
interface WebhookDeliveryView { id; webhookId; instanceId?; event; status; attempts; statusCode?; lastError?; createdAt; deliveredAt? }
```
