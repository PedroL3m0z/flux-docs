---
title: Mensagens
description: Liste chats, navegue pelo histórico, envie texto e mídia, e baixe anexos pela API HTTP da Flux.
---

Com a instância **`authorized`** (veja [Sessões](/flux-docs/pt-br/sessions/)),
você opera a conta do Telegram inteiramente por HTTP: liste chats, leia o
histórico, envie texto e mídia, e baixe os bytes dos anexos. Esta página percorre
cada operação com uma requisição pronta e o formato que ela retorna.

Toda rota abaixo precisa das **duas** headers de auth e da permissão `chat:*` /
`message:*` / `media:*` da instância:

```bash
-H 'Authorization: Bearer <JWT>' -H 'x-api-key: <API_KEY>'
```

`<id>` é o id da **instância**; `<chatId>` é um id de chat vindo da lista de
chats. Todos os ids do Telegram (`tgPeerId`, `tgMessageId`, …) cruzam a fronteira
como **strings** — excedem a precisão numérica do JS. Formatos completos em
[Tipos e contratos](/flux-docs/pt-br/types/).

## Listar chats

`GET /telegram/instances/:id/chats` — retorna os chats da conta, **mais recentes
primeiro**. Sem paginação; lista os diálogos que o Telegram mantém na conta.

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
    "title": "Notas de release",
    "hasPhoto": false
  }
]
```

`type` é `user`, `group` ou `channel`. Use o `id` do chat que você quer como
`<chatId>` nas rotas abaixo.

## Ler histórico

`GET /telegram/instances/:id/chats/:chatId/messages` — retorna mensagens **mais
novas primeiro**, paginado por cursor.

| Query | Tipo | Obrigatório | Descrição |
| --- | --- | :---: | --- |
| `cursor` | string | não | O `tgMessageId` de uma mensagem; retorna mensagens **mais antigas que** ela (pagina para trás) |
| `limit` | number | não | Tamanho da página (padrão do servidor se omitido) |

Primeira página (mensagens mais novas):

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
    "text": "até amanhã",
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

Para a **próxima página (mais antiga)**, pegue o `tgMessageId` da última (mais
antiga) mensagem que recebeu e passe como `cursor`:

```bash
curl "http://localhost:3000/telegram/instances/<id>/chats/<chatId>/messages?cursor=10498&limit=50" \
  -H 'Authorization: Bearer <JWT>' -H 'x-api-key: <API_KEY>'
```

Repita até receber menos itens que `limit` — esse é o começo do chat. `text` não
aparece em mensagens só de mídia; `media` carrega só **metadados** (veja
[Baixar um anexo](#baixar-um-anexo)).

## Enviar uma mensagem de texto

`POST /telegram/instances/:id/chats/:chatId/messages` — corpo `{ text }`.

| Campo | Tipo | Obrigatório | Regras |
| --- | --- | :---: | --- |
| `text` | string | sim | 1–4096 caracteres |

```bash
curl -X POST \
  http://localhost:3000/telegram/instances/<id>/chats/<chatId>/messages \
  -H 'Authorization: Bearer <JWT>' -H 'x-api-key: <API_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{"text":"Olá da Flux"}'
```

Retorna a `MessageView` criada com `outgoing: true` e o `tgMessageId` atribuído:

```json
{
  "id": "ab12cd",
  "chatId": "1a2b3c",
  "tgMessageId": "10503",
  "text": "Olá da Flux",
  "outgoing": true,
  "date": "2026-06-26T10:20:00.000Z"
}
```

## Enviar mídia

`POST /telegram/instances/:id/chats/:chatId/media` — **`multipart/form-data`**,
não JSON. Um arquivo por requisição, até **50 MB**.

| Parte | Tipo | Obrigatório | Regras |
| --- | --- | :---: | --- |
| `file` | file | sim | Foto, vídeo ou documento — ≤ 50 MB |
| `caption` | string | não | ≤ 1024 caracteres |

```bash
curl -X POST \
  http://localhost:3000/telegram/instances/<id>/chats/<chatId>/media \
  -H 'Authorization: Bearer <JWT>' -H 'x-api-key: <API_KEY>' \
  -F 'file=@./foto.jpg' \
  -F 'caption=Foto das férias'
```

Note os flags `-F` (não `-d`) e o `@` para subir um arquivo. O Telegram escolhe o
tipo (foto / vídeo / documento) pelo arquivo. A resposta é a `MessageView`
enviada, com o campo `media` descrevendo o anexo:

```json
{
  "id": "ef34gh",
  "chatId": "1a2b3c",
  "tgMessageId": "10504",
  "text": "Foto das férias",
  "outgoing": true,
  "date": "2026-06-26T10:22:00.000Z",
  "media": { "type": "photo", "mimeType": "image/jpeg", "fileName": "foto.jpg", "width": 1280, "height": 720 }
}
```

## Baixar um anexo

A mídia da mensagem é **baixada sob demanda**: uma `MessageView` carrega só os
metadados de `media`, nunca os bytes. Busque os bytes só quando precisar:

`GET /telegram/instances/:id/chats/:chatId/messages/:messageId/media` — transmite
os bytes crus (`application/octet-stream`); `404` se a mensagem não tem mídia.

```bash
curl "http://localhost:3000/telegram/instances/<id>/chats/<chatId>/messages/<messageId>/media" \
  -H 'Authorization: Bearer <JWT>' -H 'x-api-key: <API_KEY>' \
  -o anexo.bin
```

Use o `id` da mensagem (ou `tgMessageId`, conforme a rota) de uma mensagem cujo
`media.type` não seja `none`. Junte os bytes salvos com o `mimeType` / `fileName`
dos metadados de `media` da mensagem.

## Avatares

Fotos de chat e contato vêm como bytes de imagem (`image/jpeg`); `404` quando não
há nenhuma.

| Rota | Retorna |
| --- | --- |
| `GET …/chats/:chatId/photo` | Avatar do chat / grupo / canal |
| `GET …/contacts/:contactId/photo` | Avatar do contato |

```bash
curl "http://localhost:3000/telegram/instances/<id>/chats/<chatId>/photo" \
  -H 'Authorization: Bearer <JWT>' -H 'x-api-key: <API_KEY>' \
  -o avatar.jpg
```

`ChatView.hasPhoto` / `MessageSenderView.hasPhoto` dizem se existe avatar antes de
você buscar.

:::tip[`<img>` do browser / SSE não setam headers]
Para URLs de mídia e avatar carregadas pelo browser (ou por um `EventSource`),
passe a key como query param em vez de header: `?apiKey=<API_KEY>`. O cookie do
JWT setado no login cobre o lado do Bearer.
:::

## Reaja em tempo real

Pollar o histórico serve para catch-up, mas para **reagir conforme as mensagens
chegam**, não fique pollando — transmita-as. Novas mensagens, edições, exclusões,
recibos de leitura e reações chegam ao vivo via [Eventos (SSE)](/flux-docs/pt-br/events/)
ou ao seu endpoint via [Webhooks](/flux-docs/pt-br/webhooks/). Os payloads
`message.new` de entrada têm o mesmo formato `MessageView` mostrado acima.
