# Task ID: 8

**Title:** Implementar Reconexão (Fluxo Crítico)

**Status:** pending

**Dependencies:** 7

**Priority:** high

**Description:** Permitir cliente reconectar sem perder estado - requisito MVP de ≥90% sucesso

**Details:**

Fluxo Reconnect:
1. Client: RECONNECT {sessionId, playerId}
2. Server: validar identidade (playerId na session)
3. Server: retornar STATE_SYNC com snapshot completo
4. Server: atualizar connectionId, broadcast PLAYER_RECONNECTED
5. Timeout: 30s sem reconectar = desconectar
6. Server-authoritative: nunca aceitar estado do cliente

**Test Strategy:**

Simular desconexão/reconexão, estado consistente, timeout, broadcast
