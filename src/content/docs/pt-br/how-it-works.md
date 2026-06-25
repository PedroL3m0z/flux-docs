---
title: Como funciona
description: O caminho que uma atualização do Telegram percorre pela Flux — do MTProto até o seu endpoint.
---

A Flux fica entre o Telegram e você. Uma conta conecta por um **engine**, cada
atualização é normalizada num **evento**, e esse evento se distribui para quem
estiver escutando — um stream SSE ao vivo e/ou webhooks duráveis. Esta página
acompanha uma atualização de ponta a ponta.

![Como uma atualização flui pela Flux: Telegram → Engine → sync → event bus → SSE / webhooks → seu endpoint](../../../assets/schema.png)

## O pipeline, passo a passo

### 1. Telegram → Engine

Cada [instância](/flux-docs/pt-br/instances/) mantém uma conexão viva com o Telegram
sobre **MTProto**, conduzida pelo seu [engine](/flux-docs/pt-br/engines/) (GramJS por
padrão). O engine recebe atualizações cruas — novas mensagens, edições, leituras,
reações — conforme acontecem.

### 2. Engine → TelegramSyncService

As atualizações cruas chegam ao **sync service**, que faz duas coisas em todo evento:

- **persiste** a mensagem/chat no Postgres (para que histórico e mídia sobrevivam a
  restarts), e
- **publica** um [evento](/flux-docs/pt-br/events/) normalizado adiante.

É aqui que o formato de fio do Telegram vira os formatos estáveis da Flux
(`MessageView`, `ChatView`, …) — veja [Tipos e contratos](/flux-docs/pt-br/types/).

### 3. TelegramEventBus (RxJS Subject)

Todo evento normalizado — mais as transições `session.status` emitidas pelo
**TelegramManager** quando uma instância conecta, cai ou é revogada — é publicado
num único **event bus** em processo, como um envelope `DomainEvent`
(`instanceId`, `type`, `at`, `payload`). O bus é o único ponto de distribuição;
nada a jusante fala com o engine diretamente.

### 4. Distribuição: SSE + webhooks

Dois consumidores assinam o bus:

- **Stream SSE** (`/messages/stream`, `/status/stream`) — empurra eventos para
  qualquer cliente conectado em tempo real. Ótimo para dashboards ao vivo; não é
  durável (você só recebe eventos enquanto conectado). Veja [Eventos](/flux-docs/pt-br/events/).
- **Webhook Dispatcher** — para cada evento, encontra os [webhooks](/flux-docs/pt-br/webhooks/)
  assinados naquele tipo e vinculados àquela instância, e **cria uma linha
  `WebhookDelivery`**.

### 5. Entrega de webhook (outbox durável)

As entregas são gravadas no Postgres como um **outbox** — para sobreviverem a
restarts e serem auditáveis. Um **Delivery Worker** então as pega e faz `POST` no
seu endpoint, **assinado com HMAC** (`X-Flux-Signature`) e **com retentativa e
backoff** (`10s → 1m → 5m → 30m → 2h`; `dead` após 6 tentativas).

### 6. → Seu endpoint

Você recebe um `POST` assinado. [Verifique a assinatura](/flux-docs/pt-br/webhooks/#verifique-a-assinatura),
de-duplique pelo `X-Flux-Delivery`, e aja sobre o payload.

## Por que esse desenho

- **Um bus, muitos consumidores.** Adicionar uma nova forma de consumir eventos
  (um novo stream, um novo destino) é só assinar o bus — o engine e a camada de
  sync não mudam.
- **Agnóstico a engine.** Tudo depois do passo 2 trabalha sobre eventos
  normalizados, então um novo [engine](/flux-docs/pt-br/engines/) entra sem tocar em
  eventos ou webhooks.
- **Durável onde importa.** SSE é best-effort para UIs ao vivo; webhooks passam
  pelo outbox no Postgres para que integrações de backend tenham entrega
  at-least-once e reproduzível.

Pronto para usar? Comece em [Primeiros passos](/flux-docs/pt-br/getting-started/), ou
pule para [Eventos](/flux-docs/pt-br/events/) e [Webhooks](/flux-docs/pt-br/webhooks/).
