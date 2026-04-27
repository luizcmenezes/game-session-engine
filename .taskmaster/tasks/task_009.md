# Task ID: 9

**Title:** Desenvolver Snake Multiplayer (Jogo Exemplo MVP)

**Status:** pending

**Dependencies:** 8

**Priority:** high

**Description:** Implementar jogo de exemplo com 2 jogadores, sincronização real-time

**Details:**

Snake Multiplayer:
- GameMove type: {direction: UP|DOWN|LEFT|RIGHT}
- Campo 20x20, cobras começam em pontos opostos
- CollisionDetection: parede/auto = morte
- Food aleatório, pontuação ao comer
- Estados: WAITING (2 jogadores) → STARTED → FINISHED (1 sobrevive)
- Turn-based (validar latência <150ms)
- Frontend: Canvas para renderizar

**Test Strategy:**

Testes de colisão, spawn, sincronização 2 clientes, pontuação
