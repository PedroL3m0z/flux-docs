---
title: Instâncias
description: Crie, conecte, opere e use instâncias do Telegram — pelo dashboard ou pela API.
---

Uma **instância** é uma conta do Telegram gerenciada pela Flux. Você a cria, a
autoriza uma vez (veja [Sessões](/flux-docs/pt-br/sessions/)), e então a usa para ler e
enviar mensagens.

![Lista de instâncias no dashboard, anotada](../../../assets/screenshots/instances-annotated.png)

## Crie uma instância

### No dashboard

![Modal de adicionar instância, anotado passo a passo](../../../assets/screenshots/instance-modal-annotated.png)

1. **Instances → Add instance**.
2. Dê um **label**, escolha um **engine** (GramJS por padrão).
3. Escolha um método de login (QR ou telefone) e **Create**.

### Pela API

`POST /telegram/instances` — JWT + API key.

| Campo | Tipo | Obrigatório | Regras | Descrição |
| --- | --- | :---: | --- | --- |
| `label` | string | sim | 1–64 caracteres | Nome legível |
| `engine` | string | não | `gramjs` \| `telegraf` (padrão `gramjs`) | Backend do Telegram — veja [Engines](/flux-docs/pt-br/engines/) |
| `apiId` | string | não | só dígitos | Sobrescreve o [api_id](/flux-docs/pt-br/telegram-credentials/) global |
| `apiHash` | string | não | — | Sobrescreve o api_hash global |

```json
// POST /telegram/instances
{ "label": "Conta principal", "engine": "gramjs" }
```

A nova instância começa no status `new` — ainda não tem sessão do Telegram. A
resposta é um `InstanceView` (veja [Tipos](/flux-docs/pt-br/types/)).

## Valores de status

| Status | Significado |
| --- | --- |
| `new` | Criada, nunca logada |
| `connecting` | Estabelecendo a conexão |
| `awaiting_qr` / `awaiting_code` | Aguardando o scan do QR / código por telefone |
| `password_required` | Aguardando a senha 2FA |
| `authorized` | Conectada e utilizável |
| `disconnected` | Parada, sessão mantida |
| `error` | Sessão revogada/expirada — logue de novo |

## Opere uma instância

### No dashboard

![Ações da linha da instância, anotadas](../../../assets/screenshots/instances-row-annotated.png)

Cada linha expõe, como botões de ícone: **info** (estado ao vivo), **abrir chats**,
**start/stop** e **delete**.

### Pela API

| Rota | Método | Descrição |
| --- | --- | --- |
| `/telegram/instances` | GET | Lista instâncias |
| `/telegram/instances/:id` | GET | Uma instância |
| `/telegram/instances/:id/info` | GET | Detalhes + estado de conexão ao vivo + uptime |
| `/telegram/instances/:id/start` | POST | Conecta a partir da sessão salva |
| `/telegram/instances/:id/stop` | POST | Desconecta (mantém a sessão) |
| `/telegram/instances/:id` | DELETE | Remove a instância **e sua sessão** (cascateia chats/mensagens) |

`start`/`stop`/`delete` não levam corpo. Para autorizar uma instância `new`, veja
[Sessões](/flux-docs/pt-br/sessions/).

## Chats, mensagens e mídia

Uma vez que a instância esteja `authorized` você pode navegar por chats e
contatos, ler o histórico paginado, e enviar texto ou mídia (fotos, vídeos,
documentos até 50 MB) — no dashboard, ou pela API. O passo a passo completo com
requisições prontas e formatos de resposta está em
**[Mensagens](/flux-docs/pt-br/messaging/)**:

| Ação | Rota | Método |
| --- | --- | --- |
| Listar chats | `/telegram/instances/:id/chats` | GET |
| Ler histórico | `/telegram/instances/:id/chats/:chatId/messages` | GET |
| Enviar texto | `/telegram/instances/:id/chats/:chatId/messages` | POST |
| Enviar mídia | `/telegram/instances/:id/chats/:chatId/media` | POST |
| Baixar anexo | `…/chats/:chatId/messages/:messageId/media` | GET |
| Avatar de chat / contato | `…/chats/:chatId/photo`, `…/contacts/:contactId/photo` | GET |

Para reagir a mensagens recebidas, consuma [Eventos](/flux-docs/pt-br/events/) ou assine um
[Webhook](/flux-docs/pt-br/webhooks/). Para uma visão da conta toda, `GET /telegram/stats`
retorna uptime e contagens total/autorizadas/conectadas.
