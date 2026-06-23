---
title: Configuration
description: Environment variables and deployment.
---

**No variable is required.** The fields below are auto-derived or auto-generated when absent. Set only what you want to pin.

| Variable | Default / behavior |
| --- | --- |
| `DATABASE_URL` | Derived from `POSTGRES_*` / compose defaults when empty |
| `POSTGRES_USER/PASSWORD/DB` | `flux`/`flux`/`flux` |
| `REDIS_HOST` / `REDIS_PORT` | `localhost` / `6379` |
| `REDIS_PASSWORD` | empty (no auth) |
| `JWT_SECRET` | **Auto-generated** (CSPRNG) and persisted in `DATA_DIR` if empty |
| `API_KEY` | **Auto-generated** and printed once if empty (`x-api-key` header) |
| `TELEGRAM_SESSION_SECRET` | **Auto-generated**; encrypts sessions/secrets at rest (AES-256-GCM) |
| `DATA_DIR` | Where auto-generated secrets are saved (default `./data`) |
| `JWT_EXPIRES_IN` | Token lifetime (default `3600s`) |
| `SEED_EMAIL/USERNAME/PASSWORD` | Pin the first admin; otherwise one is auto-created |
| `TELEGRAM_API_ID/HASH` | Default GramJS api_id/api_hash (or per instance / settings) |
| `CORS_ORIGIN` | Origin whitelist (default `*`; production refuses `*`) |
| `COOKIE_SECURE` | `true` for a `Secure` cookie (behind TLS) |
| `PORT` | HTTP port (default `3000`) |
| `NODE_ENV` | `development` / `production` |

:::caution[Persist your secrets]
Auto-generated secrets use a CSPRNG and live in `DATA_DIR` (`secrets.json`,
permission `600`) — mount a persistent volume so they do not rotate on every
restart (which would invalidate tokens and sessions). Weak placeholders from old
templates (e.g. `change-me-...`) are treated as empty and replaced with strong
values. In production, serve behind TLS and restrict `CORS_ORIGIN`.
:::

## Deployment

### Docker Compose (dev/staging)

```bash
docker compose up -d
```

### Standalone image (production)

```bash
docker build -t flux-api:latest .

docker run -d \
  -e DATABASE_URL="postgresql://user:pass@host:5432/flux" \
  -e REDIS_HOST="host" -e REDIS_PORT="6379" \
  -e JWT_SECRET="..." \
  -e API_KEY="..." \
  -e TELEGRAM_SESSION_SECRET="..." \
  -v flux_data:/data \
  -p 3000:3000 \
  flux-api:latest
```

Mount a volume at `/data` (`DATA_DIR`) so generated secrets persist across container recreations.
