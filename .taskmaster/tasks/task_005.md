# Task ID: 5

**Title:** Implementar InMemory Repository (Adaptador)

**Status:** pending

**Dependencies:** 3

**Priority:** high

**Description:** Persistência em memória (MVP local) com versionamento otimista

**Details:**

InMemoryGameSessionRepository:
- Map<sessionId, {session, version}>
- save() valida expectedVersion, lança VersionConflictException
- findById() retorna session ou null
- getAll() para testes
- Totalmente em RAM, sem dependências externas

**Test Strategy:**

Testes de concorrência simples, versionamento, VersionConflictException
