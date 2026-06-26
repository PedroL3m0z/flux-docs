---
title: Webhooks
description: Receba eventos do Telegram no seu endpoint — assinados e com retentativas. Gerencie pelo dashboard ou pela API.
---

Um **webhook** entrega eventos a uma URL que você controla. Você o assina em um
subconjunto de [tipos de evento](/flux-docs/pt-br/events/) e o vincula a uma ou mais
[instâncias](/flux-docs/pt-br/instances/); sempre que um evento correspondente acontece, a Flux
faz POST dele no seu endpoint com retentativas e uma assinatura HMAC.

![Lista de webhooks no dashboard, anotada](../../../assets/screenshots/webhooks-annotated.png)

## Crie um webhook

### No dashboard

![Modal de adicionar webhook, anotado passo a passo](../../../assets/screenshots/webhook-modal-annotated.png)

1. **Webhooks → Add webhook**.
2. Defina um **nome** e sua **URL**, marque os **tipos de evento**, vincule as
   **instâncias** a escutar.
3. Escolha o **escopo do destino** — **External** (internet pública, padrão) ou
   **Internal** (um endereço privado/loopback na mesma rede).
4. **Create** — o **secret** de assinatura é mostrado **uma vez**; copie agora.

### Pela API

`POST /webhooks` — JWT + API key.

| Campo | Tipo | Obrigatório | Regras | Descrição |
| --- | --- | :---: | --- | --- |
| `name` | string | sim | 1–80 caracteres | Rótulo do webhook |
| `url` | string | sim | URL válida | Onde as entregas são enviadas via POST |
| `events` | string[] | sim | não vazio; cada um um [tipo de evento](/flux-docs/pt-br/events/) válido | Quais eventos enviar |
| `instanceIds` | string[] | não | ids de instância | Instâncias a escutar (vincule depois se omitido) |
| `allowInternal` | boolean | não | padrão `false` | Permite um destino **privado/loopback** (mesma rede Docker / LAN) — veja [Escopo do destino](#escopo-do-destino-external-vs-internal) |

```json
// POST /webhooks
{
  "name": "Minha integração",
  "url": "https://example.com/hooks/flux",
  "events": ["message.new", "message.read"],
  "instanceIds": ["<instanceId>"],
  "allowInternal": false
}
```

A resposta é um `WebhookWithSecret` — o `secret` (prefixo `whsec_`) aparece
**só aqui**. Liste os tipos assináveis com `GET /webhooks/event-types`.

## Recebendo uma entrega

A Flux envia um `POST` com este corpo:

```json
{
  "event": "message.new",
  "instanceId": "<instanceId>",
  "at": "2026-06-19T12:00:00.000Z",
  "data": { "...": "o payload do evento, ex.: um MessageView" }
}
```

E estes headers:

| Header | Conteúdo |
| --- | --- |
| `Content-Type` | `application/json` |
| `User-Agent` | `Flux-Webhooks/1.0` |
| `X-Flux-Event` | tipo do evento (ex.: `message.new`) |
| `X-Flux-Delivery` | id da entrega — use para idempotência |
| `X-Flux-Instance` | id da instância de origem (quando aplicável) |
| `X-Flux-Signature` | `sha256=<hmac-hex>` do corpo bruto, usando o `secret` do webhook |

## Verifique a assinatura

Sempre verifique antes de confiar numa entrega. Assine o corpo **bruto** com seu
secret e compare em tempo constante:

```ts
import { createHmac, timingSafeEqual } from 'node:crypto';

function verify(rawBody: string, header: string, secret: string): boolean {
  const expected = `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`;
  const a = Buffer.from(expected);
  const b = Buffer.from(header);
  return a.length === b.length && timingSafeEqual(a, b);
}
```

## Garantias de entrega

- **Durável** — toda tentativa é armazenada, sobrevivendo a restarts.
- **Retentativa com backoff** — `10s → 1m → 5m → 30m → 2h`; após **6 tentativas** uma
  entrega é marcada como `dead`. Cada registro expõe `nextAttemptAt`.
- **Auditável** — cada entrega captura o **corpo da resposta** do destino (um
  trecho truncado, até 2000 chars) e o último erro; inspecione o log e reenvie
  manualmente.

## Gerencie

### No dashboard

![Ações da linha do webhook, anotadas](../../../assets/screenshots/webhooks-row-annotated.png)

Cada linha: alternar **active**, ver **deliveries**, **rotacionar secret**, **editar**,
**excluir**. O log de entregas mostra status, código HTTP e tentativas, com reenvio
manual; uma entrega que falhou auto-expande um painel de detalhe com o **erro**, o
**corpo da resposta** do destino e o **horário da próxima tentativa**:

![Modal de entregas do webhook, anotado](../../../assets/screenshots/webhook-deliveries-annotated.png)

### Pela API

| Ação | Rota | Método |
| --- | --- | --- |
| Listar seus webhooks | `/webhooks` | GET |
| Pegar um | `/webhooks/:id` | GET |
| Atualizar | `/webhooks/:id` | PATCH |
| Excluir (e suas entregas) | `/webhooks/:id` | DELETE |
| Rotacionar o secret (retornado uma vez) | `/webhooks/:id/regenerate-secret` | POST |
| Vincular uma instância | `/webhooks/:id/instances/:instanceId` | POST |
| Desvincular uma instância | `/webhooks/:id/instances/:instanceId` | DELETE |
| Log de entregas (`?limit=`, padrão 50) | `/webhooks/:id/deliveries` | GET |
| Reenfileirar uma entrega agora | `/webhooks/deliveries/:deliveryId/resend` | POST |

**Atualizar** (`PATCH /webhooks/:id`) — todos os campos opcionais:

| Campo | Tipo | Regras | Descrição |
| --- | --- | --- | --- |
| `name` | string | 1–80 caracteres | Renomear |
| `url` | string | URL válida | Trocar o endpoint |
| `active` | boolean | — | Habilitar/desabilitar entrega |
| `events` | string[] | tipos de evento válidos | Substituir a assinatura |
| `allowInternal` | boolean | — | Alternar destinos privados/loopback (veja abaixo) |

## Escopo do destino (External vs Internal)

Por padrão um webhook é **External**: URLs apontando para localhost, faixas de IP
privadas ou reservadas são **rejeitadas** na criação/atualização e reverificadas
(com resolução DNS) **antes de cada entrega**, para o webhook não poder alcançar
endereços internos (guarda SSRF).

Defina **`allowInternal: true`** (a escolha **Internal** no formulário) para
entregar a um endereço privado/loopback — ex.: outro serviço na **mesma rede
Docker ou LAN**, como um n8n local. Isso relaxa a guarda só para faixas
privadas/loopback.

:::caution[Sempre bloqueados]
**Endereços de cloud-metadata e link-local continuam bloqueados
incondicionalmente**, mesmo com `allowInternal: true`. Para destinos públicos,
mantenha `false` e use uma URL HTTPS acessível.
:::
