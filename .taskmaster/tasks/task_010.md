# Task ID: 10

**Title:** Implementar Frontend Angular (Cliente Web)

**Status:** pending

**Dependencies:** 9

**Priority:** high

**Description:** UI para lobby, renderização de jogo, reconexão transparente

**Details:**

Componentes:
1. LobbyComponent: criar/entrar sessão
2. GameComponent: renderizar Canvas, input player
3. WebSocketService: encapsula Socket.io
4. Estados: LOBBY, WAITING, PLAYING, FINISHED, RECONNECTING
5. UX: spinner reconexão, error messages
6. Responsivo: mobile touch controls
7. Conectar: ws://localhost:3000

**Test Strategy:**

E2E: criar sessão, iniciar jogo, fazer moves, reconectar
