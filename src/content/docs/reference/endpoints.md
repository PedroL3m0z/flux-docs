---
title: Endpoints
description: The full REST surface of Flux API.
---

Most routes require **JWT (Bearer)** + **`x-api-key`**. `auth` and `health` have exceptions (see the Auth column). Interactive documentation is served at **`/docs`**.

## Auth

| Route | Method | Auth | Description |
| --- | --- | --- | --- |
| `/auth/register` | POST | JWT + API key | Create a user (**admin only**; the 1st seeded user is admin) |
| `/auth/login` | POST | public | Login; sets the httpOnly JWT cookie and returns the token |
| `/auth/logout` | POST | public | Clears the auth cookie |
| `/auth/me` | GET | Bearer JWT | Current user (no API key required) |
| `/auth/api-key-check` | GET | `x-api-key` | Validates the static API key |

## Telegram — settings & stats

| Route | Method | Description |
| --- | --- | --- |
| `/telegram/settings` | GET | Read `api_id` / `hasApiHash` (api_hash never leaves) |
| `/telegram/settings` | PUT | Set the global `api_id` / `api_hash` |
| `/telegram/stats` | GET | Uptime + total/authorized/connected instances |

## Telegram — instances & login

| Route | Method | Description |
| --- | --- | --- |
| `/telegram/instances` | POST | Create an instance (label, engine?, api_id?, api_hash?) |
| `/telegram/instances` | GET | List instances |
| `/telegram/instances/:id` | GET | Details of one instance |
| `/telegram/instances/:id` | DELETE | Remove an instance (and its session) |
| `/telegram/instances/:id/info` | GET | Details + live connection state + uptime |
| `/telegram/instances/:id/start` | POST | Connect from the saved session |
| `/telegram/instances/:id/stop` | POST | Disconnect (keeps the session) |
| `/telegram/instances/status/stream` | SSE | Stream of status transitions for all instances |
| `/telegram/instances/:id/login/qr` | SSE | QR login stream: `qr` → `password_required` → `authorized` |
| `/telegram/instances/:id/login/phone` | POST | Start phone login `{phone}` — Telegram sends a code |
| `/telegram/instances/:id/login/code` | POST | Submit the OTP `{code}` → `password_required` or `authorized` |
| `/telegram/instances/:id/login/password` | POST | Submit the 2FA password (QR or phone login) |

## Telegram — chats, messages & media

| Route | Method | Description |
| --- | --- | --- |
| `/telegram/instances/:id/chats` | GET | List chats (most recent first) |
| `/telegram/instances/:id/chats/:chatId/messages` | GET | List messages (cursor-paginated) |
| `/telegram/instances/:id/chats/:chatId/messages` | POST | Send a text message |
| `/telegram/instances/:id/chats/:chatId/media` | POST | Send photo/video/document (multipart, ≤ 50 MB) |
| `/telegram/instances/:id/messages/stream` | SSE | Stream of new messages |
| `/telegram/instances/:id/chats/:chatId/photo` | GET | Chat/group avatar (bytes) |
| `/telegram/instances/:id/contacts/:contactId/photo` | GET | Contact avatar (bytes) |
| `/telegram/instances/:id/chats/:chatId/messages/:messageId/media` | GET | Message attachment (bytes, lazy download) |

## Webhooks

| Route | Method | Description |
| --- | --- | --- |
| `/webhooks/event-types` | GET | List the subscribable event types |
| `/webhooks` | POST | Create a webhook (returns the `secret` once) |
| `/webhooks` | GET | List your webhooks |
| `/webhooks/:id` | GET | Details of one webhook |
| `/webhooks/:id` | PATCH | Update (name, url, active, events) |
| `/webhooks/:id` | DELETE | Remove the webhook and its deliveries |
| `/webhooks/:id/regenerate-secret` | POST | Rotate the signing secret (returned once) |
| `/webhooks/:id/instances/:instanceId` | POST | Link an instance (M2M) |
| `/webhooks/:id/instances/:instanceId` | DELETE | Unlink an instance |
| `/webhooks/:id/deliveries` | GET | Delivery log (`?limit=`, default 50) |
| `/webhooks/deliveries/:deliveryId/resend` | POST | Re-queue a delivery for immediate resend |

## Users & system

| Route | Method | Auth | Description |
| --- | --- | --- | --- |
| `/users` | GET | JWT + API key | List registered users (`admin` only) |
| `/users/:id/role` | PATCH | JWT + API key | Change the global role (`admin` only) |
| `/users/:id` | PATCH | JWT + API key | Edit a user (`admin` only) |
| `/users/:id` | DELETE | JWT + API key | Delete a user and cascade (`admin` only) |
| `/` | GET | public | Redirects to `/dashboard` |
| `/health` | GET | public | Postgres + Redis + Telegram + heap |
| `/docs` | GET | public | Scalar API Reference (OpenAPI) |
| `/dashboard` | GET | public | Vue SPA |
