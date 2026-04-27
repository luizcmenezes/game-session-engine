# Task ID: 4

**Title:** Implementar Use Cases (Camada de Aplicação)

**Status:** pending

**Dependencies:** 3

**Priority:** high

**Description:** Orquestração de negócio: JoinGame, StartGame, MakeMove, Reconnect - TDD

**Details:**

Use Cases:
1. JoinGameUseCase: validar sessão, criar Player, adicionar
2. StartGameUseCase: verificar mín 2 jogadores, transição STARTED
3. MakeMoveUseCase: validar turno/regras, aplicar move
4. ReconnectUseCase: validar playerId/sessionId, retornar snapshot completo
- Injeção de dependência: Repository, MessageBus
- TDD: testes de integração UC + mocks

**Test Strategy:**

Testes de cada UC: caminho feliz, validações, exceções
