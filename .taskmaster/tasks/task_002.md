# Task ID: 2

**Title:** Implementar Aggregate Root GameSession (Domínio)

**Status:** pending

**Dependencies:** 1

**Priority:** high

**Description:** Criar entidade core com regras de negócio: validações, transições de estado, versionamento otimista para sincronização

**Details:**

Classe GameSession:
- Propriedades: id, players[], status (WAITING|STARTED|FINISHED), version
- Métodos: addPlayer(), startGame(), makeMove(), getState()
- Validações: máx 4 jogadores, não entra após STARTED, versionamento obrigatório
- Value Objects: Player(id,name,score), Move
- Eventos de domínio: PlayerJoined, GameStarted, MoveMade
- TDD: testes unit para todas as regras

**Test Strategy:**

Unit tests para cada método, validações, transições de estado inválidas
