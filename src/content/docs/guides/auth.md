---
title: Auth & security
description: How requests are authenticated and what protects the gateway.
---

Two layers protect the API:

- **JWT** — identifies the dashboard user. Obtained from `POST /auth/login` (set as an `httpOnly` cookie **and** returned as a bearer token). `GET /auth/me` accepts a JWT without requiring the API key.
- **API key** — the `x-api-key` header, the gateway's static key required on most routes (`auth` and `health` are exempt). For browser-driven requests that can't set headers (SSE, `<img>` media URLs) it may be passed as an `?apiKey=` query parameter.

## Hardening

- **Passwords** — Argon2id hashing (never plaintext).
- **API key comparison** — constant-time (`crypto.timingSafeEqual`) to avoid timing side-channels.
- **Telegram `api_hash` & sessions** — encrypted at rest with AES-256-GCM; never returned.
- **Webhook SSRF guard** — outbound URLs targeting internal/reserved addresses are rejected and re-checked before delivery.
- **Rate limiting** — global per-IP throttling (`@nestjs/throttler`).
- **Helmet** — strict CSP on the API; relaxed only on `/docs` (Scalar) and `/dashboard` (SPA).
- **CORS** — whitelisted origins via `CORS_ORIGIN` (production refuses the `*` wildcard).
- **Safe BigInt** — int64 ids serialized as strings.

## Roles & permissions

Every user has one global role. Permissions are granted per role:

| Permission | viewer | operator | admin |
| --- | :---: | :---: | :---: |
| `instance:read`, `chat:read`, `message:read`, `webhook:read` | ✅ | ✅ | ✅ |
| `instance:manage` / `delete`, `message:send`, `media:send`, `webhook:manage` | | ✅ | ✅ |
| `user:read`, `user:manage` | | | ✅ |

The first seeded user is an `admin`. Admins manage other users via `/users`, but cannot change or delete their own account through those routes.
