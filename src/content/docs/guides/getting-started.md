---
title: Getting started
description: Run the full Flux stack locally in one command.
---

## Prerequisites

- Node.js 22+
- Docker + Docker Compose (Postgres + Redis)
- Git

## Install

```bash
git clone https://github.com/PedroL3m0z/Flux-Api.git
cd flux-api

# Optional: the app boots without a .env. Copy it only to override something.
cp .env.example .env

yarn install
yarn prisma:generate
```

:::tip[Zero-config boot]
**No variable is required.** With nothing defined, the app derives `DATABASE_URL`
from the bundled Postgres and **generates strong secrets** (`JWT_SECRET`,
`API_KEY`, `TELEGRAM_SESSION_SECRET`) on first boot, saving them to
`./data/secrets.json` (`DATA_DIR`). It also creates an initial **admin** user.
The generated API key and admin password are printed to the log **once** — copy
them. Set any variable in `.env` to override the automatic values.
:::

## Run with Docker (recommended)

```bash
docker compose up -d
```

| Surface | URL |
| --- | --- |
| API | `http://localhost:3000` |
| Dashboard | `http://localhost:3000/dashboard` |
| API docs (Scalar) | `http://localhost:3000/docs` |
| Postgres | `localhost:5433` (user `flux` / pass `flux`) |
| Redis | `localhost:6379` |

## Run locally (infra in Docker, app on host)

```bash
docker compose up -d postgres redis
yarn prisma migrate dev --schema=src/core/prisma/schema.prisma
yarn start:dev
```

## Production build

```bash
yarn build:all      # backend + frontend
node dist/main.js
```

## First login

On first boot Flux seeds an admin. If you didn't set `SEED_*`, the username is
`admin` and the password is printed in the boot log (and stored in
`data/secrets.json`). Log in at `/dashboard`, then set your Telegram
`api_id` / `api_hash` in **Settings** (get them at
[my.telegram.org](https://my.telegram.org)) and create your first instance.
