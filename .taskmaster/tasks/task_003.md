# Task ID: 3

**Title:** Implementar Ports (Interfaces) - Repository e MessageBus

**Status:** pending

**Dependencies:** 2

**Priority:** high

**Description:** Definir contratos para persistência e publicação de eventos, isolando domínio de frameworks

**Details:**

Interfaces:
- IGameSessionRepository: findById(id), save(session, expectedVersion)
- IMessageBus: publish(event)
- Tipos de eventos: PlayerJoinedEvent, GameStartedEvent, MoveMadeEvent
- Exceções: VersionConflictException, SessionNotFoundException
- Contrato claro de optimistic locking (expectedVersion validação)

**Test Strategy:**

Interfaces bem definidas, implementáveis por adapters diferentes
