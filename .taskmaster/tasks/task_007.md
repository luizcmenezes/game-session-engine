# Task ID: 7

**Title:** Implementar WebSocket Gateway (NestJS + Socket.io)

**Status:** pending

**Dependencies:** 4, 5, 6

**Priority:** high

**Description:** Camada de comunicação real-time entre server e clientes

**Details:**

@WebSocketGateway:
- Listeners: JOIN_GAME, LEAVE_GAME, START_GAME, MAKE_MOVE, RECONNECT
- Cada evento chama UC correspondente
- Broadcasts: STATE_SYNC após mudança, PLAYER_JOINED, GAME_STARTED, MOVE_APPLIED
- Mapa {playerId -> socketId} para reconexão
- Error handling com EVENT_ERROR
- Session management com connectionId transiente

**Test Strategy:**

Testes de integração: WebSocket simulation, broadcasts verificados
