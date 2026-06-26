---
title: Referência da API
description: Cada endpoint da Flux num só lugar, agrupado por área — com as docs interativas (Scalar) em /docs.
---

A Flux traz uma spec **OpenAPI** completa renderizada com **Scalar** em
[`/docs`](http://localhost:3000/docs) — uma referência interativa onde você pode
ler cada schema e testar requisições no navegador. Esta página é o índice plano e
fácil de copiar das mesmas rotas.

:::tip[Docs interativas]
Abra `http://localhost:3000/docs` para a UI Scalar ao vivo: schemas de
request/response, exemplos e um cliente embutido. É pública (sem auth) para você
navegar antes de logar.
:::

## Modelo de auth

A maioria das rotas exige **ambos** um JWT (Bearer) e o header **`x-api-key`**. O
grupo `auth` e `/health` são as exceções — veja a coluna **Auth**.

| Camada | Header | De onde |
| --- | --- | --- |
| JWT | `Authorization: Bearer <token>` | `POST /auth/login` (também definido como cookie `httpOnly`) |
| API key | `x-api-key: <key>` | impressa no primeiro boot / env `API_KEY` |

Para detalhes veja [Autenticação](/flux-docs/pt-br/authentication/). SSE no navegador e
tags de mídia que não podem definir headers podem passar `?apiKey=<API_KEY>`.

## Auth

| Rota | Método | Auth | Descrição |
| --- | --- | --- | --- |
| `/auth/register` | POST | Bearer + API key | Criar um usuário (**só admin**) |
| `/auth/login` | POST | público | Login; retorna o JWT e define o cookie |
| `/auth/logout` | POST | público | Limpa o cookie de auth |
| `/auth/me` | GET | Bearer (sem API key) | Usuário atual |
| `/auth/api-key-check` | GET | `x-api-key` | Valida a API key estática |

## Telegram — settings e stats

| Rota | Método | Descrição |
| --- | --- | --- |
| `/telegram/settings` | GET | Lê `api_id` / `hasApiHash` (o hash nunca sai) |
| `/telegram/settings` | PUT | Define o `api_id` / `api_hash` global |
| `/telegram/stats` | GET | Uptime + instâncias totais / autorizadas / conectadas |

## Telegram — instâncias e login

| Rota | Método | Descrição |
| --- | --- | --- |
| `/telegram/instances` | POST | Criar uma instância (`label`, `engine?`, `apiId?`, `apiHash?`) |
| `/telegram/instances` | GET | Listar instâncias |
| `/telegram/instances/:id` | GET | Uma instância |
| `/telegram/instances/:id` | DELETE | Remove a instância e sua sessão |
| `/telegram/instances/:id/info` | GET | Detalhes + estado de conexão ao vivo + uptime |
| `/telegram/instances/:id/start` | POST | Conecta a partir da sessão salva |
| `/telegram/instances/:id/stop` | POST | Desconecta (mantém a sessão) |
| `/telegram/instances/status/stream` | SSE | Transições de status de todas as instâncias |
| `/telegram/instances/:id/login/qr` | SSE | Stream de login por QR: `qr` → `password_required` → `authorized` |
| `/telegram/instances/:id/login/phone` | POST | Inicia login por telefone `{ phone }` — o Telegram envia um código |
| `/telegram/instances/:id/login/code` | POST | Envia o OTP `{ code }` → `password_required` ou `authorized` |
| `/telegram/instances/:id/login/password` | POST | Envia a senha 2FA `{ password }` |

Veja [Instâncias](/flux-docs/pt-br/instances/) e [Sessões](/flux-docs/pt-br/sessions/) para
os fluxos, e o modal **Add instance**:

![Modal de adicionar instância, anotado](../../../assets/screenshots/instance-modal-annotated.png)

## Telegram — chats, mensagens e mídia

| Rota | Método | Descrição |
| --- | --- | --- |
| `/telegram/instances/:id/chats` | GET | Lista chats (mais recentes primeiro) |
| `/telegram/instances/:id/chats/:chatId/messages` | GET | Lista mensagens (paginação por cursor: `?cursor=&limit=`) |
| `/telegram/instances/:id/chats/:chatId/messages` | POST | Envia mensagem de texto `{ text }` (1–4096 caracteres) |
| `/telegram/instances/:id/chats/:chatId/media` | POST | Envia foto/vídeo/documento (multipart `file` + `caption?`, ≤ 50 MB) |
| `/telegram/instances/:id/messages/stream` | SSE | Stream de novas mensagens |
| `/telegram/instances/:id/chats/:chatId/photo` | GET | Avatar do chat/grupo (bytes) |
| `/telegram/instances/:id/contacts/:contactId/photo` | GET | Avatar do contato (bytes) |
| `/telegram/instances/:id/chats/:chatId/messages/:messageId/media` | GET | Anexo da mensagem (bytes, download sob demanda) |

Requisições prontas e formatos de resposta disso estão em
[Mensagens](/flux-docs/pt-br/messaging/); os tipos crus em
[Tipos e contratos](/flux-docs/pt-br/types/).

## Webhooks

| Rota | Método | Descrição |
| --- | --- | --- |
| `/webhooks/event-types` | GET | Lista os tipos de evento assináveis |
| `/webhooks` | POST | Cria um webhook (`name`, `url`, `events`, `instanceIds?`, `allowInternal?`); retorna o `secret` **uma vez** |
| `/webhooks` | GET | Lista seus webhooks |
| `/webhooks/:id` | GET | Um webhook |
| `/webhooks/:id` | PATCH | Atualiza (`name?`, `url?`, `active?`, `events?`, `allowInternal?`) |
| `/webhooks/:id` | DELETE | Remove o webhook e suas entregas |
| `/webhooks/:id/regenerate-secret` | POST | Rotaciona o secret de assinatura (retornado uma vez) |
| `/webhooks/:id/instances/:instanceId` | POST | Vincula uma instância (M2M) |
| `/webhooks/:id/instances/:instanceId` | DELETE | Desvincula uma instância |
| `/webhooks/:id/deliveries` | GET | Log de entregas (`?limit=`, padrão 50) |
| `/webhooks/deliveries/:deliveryId/resend` | POST | Reenfileira uma entrega para reenvio imediato |

A semântica completa de entrega (assinatura, retry/backoff, headers) está em
[Webhooks](/flux-docs/pt-br/webhooks/).

## Usuários e sistema

| Rota | Método | Auth | Descrição |
| --- | --- | --- | --- |
| `/users` | GET | Bearer + API key | Lista usuários (**admin**) |
| `/users/:id/role` | PATCH | Bearer + API key | Muda o papel global (admin; não o seu) |
| `/users/:id` | PATCH | Bearer + API key | Edita um usuário `{ email?, username?, password?, role? }` (admin) |
| `/users/:id` | DELETE | Bearer + API key | Exclui um usuário, cascateia instâncias/webhooks (admin; não você mesmo) |
| `/` | GET | público | Redireciona para `/dashboard` |
| `/health` | GET | público | Postgres + Redis + Telegram + heap |
| `/docs` | GET | público | Scalar API Reference (OpenAPI) |
| `/dashboard` | GET | público | SPA Vue |
