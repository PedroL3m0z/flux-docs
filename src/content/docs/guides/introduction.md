---
title: Introduction
description: What Flux API is and what you can do with it.
---

**Flux is an HTTP gateway for Telegram.** It runs Telegram accounts as **instances** and exposes them through a clean REST API, a realtime (SSE) stream and signed outbound webhooks. It is built on NestJS 11 + Prisma 7 (PostgreSQL) + Redis, with a Vue 3 dashboard to manage everything visually.

## What you can do

- Connect accounts via **QR code or phone (OTP) + 2FA**, with the session persisted and automatic reconnection.
- **Read chats and history**, **send messages and media**, and download avatars/attachments.
- Receive **realtime events** (new/edited/deleted messages, read receipts, reactions, session status) over SSE **and** over durable, signed **webhooks**.
- Operate everything from a **dashboard** or directly through the **API** (with OpenAPI/Scalar at `/docs`).

## The stack

| Concern | Library |
| --- | --- |
| Runtime | Node.js 22 + TypeScript |
| Framework | NestJS 11 (DI, decorators, modules) |
| ORM | Prisma 7 + PostgreSQL 17 |
| Cache | Redis 7 (Telegram sessions) |
| Auth | `@nestjs/passport` (local, jwt, api-key) + `@nestjs/jwt` + `argon2` |
| API docs | OpenAPI (`@nestjs/swagger`) + Scalar UI at `/docs` |
| Telegram | GramJS (MTProto client) |
| Realtime | Server-Sent Events (SSE) + RxJS |
| Webhooks | Postgres outbox + worker + HMAC-SHA256 |
| Frontend | Vue 3 + TypeScript + Tailwind + vue-i18n + Pinia |

## Status & roadmap

Done: on-demand history (cursor pagination), media send/download, the event system (status, messages, read receipts, reactions), and webhooks (M2M, HMAC, retry, log).

Planned: a Telegraf engine (Bot API), group participants, cross-chat search, and OAuth2 login (GitHub, Google).

Licensed under **Apache 2.0**.
