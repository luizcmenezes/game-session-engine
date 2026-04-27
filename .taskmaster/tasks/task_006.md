# Task ID: 6

**Title:** Implementar In-Memory MessageBus (Adaptador)

**Status:** pending

**Dependencies:** 3

**Priority:** medium

**Description:** Publicação de eventos para subscribers (fase 1, antes de Redis/NATS)

**Details:**

InMemoryMessageBus:
- Array de subscribers registrados
- publish() executa todos os handlers de um evento
- Suportar múltiplos handlers por tipo
- Logging simples (console.log MVP)
- Preparar para: Redis pub/sub, NATS (fase 2)

**Test Strategy:**

Handlers chamados corretamente, ordem preservada
