# 🎮 PRD — Multiplayer Game Session Engine (MVP → Escala)

## 1. 🎯 Visão do Produto

Plataforma de jogos multiplayer em tempo real, com foco em **integridade de estado**, **reconexão confiável** e **baixa latência**, evoluindo de um servidor local para infraestrutura global.

**Objetivo do MVP:** validar sincronização multiplayer e reconexão em **dois jogos de naturezas distintas (Snake real-time e War-Light turn-based)**, garantindo que o engine seja genuinamente reutilizável.

---

## 2. 🎯 Objetivos de Negócio

- Validar retenção em sessões multiplayer
- Preparar base para monetização (assinatura / itens / torneios)
- Construir engine reutilizável para múltiplos jogos

### Métricas de sucesso (MVP)
- ≥ 95% sessões sem inconsistência de estado
- Reconexão bem-sucedida em ≥ 90% dos casos
- Latência média < 150ms (rede local / baixa carga)
- ≥ 3 usuários simultâneos por sessão estável

---

## 3. 👥 Personas

### Jogador Casual
- Entra rapidamente em partidas
- Espera reconexão transparente

### Jogador Competitivo (futuro)
- Exige consistência e justiça
- Sensível a lag e desync

---

## 4. 🧱 Escopo do MVP

### Incluído
- Criação/entrada em sessão
- Sincronização de estado em tempo real
- Reconexão de jogador
- Limite de jogadores por sessão (2–4)
- **Dois jogos exemplo**: Snake multiplayer (real-time, tick-based) e War-Light multiplayer (turn-based com fases distribution/reinforcement/attack)

### Fora do escopo (MVP)
- Sistema de ranking
- Loja/monetização ativa
- Matchmaking avançado
- Chat/voz
- **CPU/IA** (perfis easy/normal/hard do War-Light) — fica para fase 2

---

## 5. ⚙️ Arquitetura (Resumo)

- Clean Architecture + Hexagonal (Ports & Adapters)
- Domínio isolado (TypeScript puro)
- Backend: NestJS (WebSocket Gateway)
- Frontend: Angular (strict)
- Persistência: PostgreSQL (fase 2)
- Cache/tempo real: Redis (fase 2)

```
UI → Facade → UseCase → Aggregate → Repository → Event → WebSocket → Clients
```

---

## 6. 🧠 Modelo de Domínio (Core)

### Aggregate Root
- `GameSession`
  - id
  - players[]
  - status (WAITING | STARTED | FINISHED)
  - version (optimistic locking)
  - **gameType** (`"snake" | "war-light"`) — discriminador para selecionar o `IGameRules` correto
  - **gameState** (opaque) — payload gerenciado pelo strategy do jogo (Snake: cobras+comida; War: territórios+fase+turno)

### Entidades/VOs
- Player (id, name, score)
- Move (depende do jogo, validado pelo `IGameRules`)

### Strategy por jogo
- **`IGameRules<TState, TMove>`** — port plugável por jogo. Métodos:
  - `getInitialState(playerIds)` — estado inicial após START
  - `applyMove(state, move, playerId)` — valida e aplica movimento
  - `isGameOver(state)` — condição de fim
  - `getValidMoves(state, playerId)` — moves possíveis (útil para validação e UI)
  - `getWinner(state)` — quem venceu (ou empate)

### Regras-chave
- Máx. 4 jogadores
- Não entra após STARTED
- Versionamento para evitar conflitos
- Lógica específica do jogo vive no `IGameRules`, **não no aggregate**

---

## 7. 🔌 Contratos (Ports)

### Repository
- `findById(id): Promise<GameSession | null>`
- `save(session, expectedVersion): Promise<void>`

### MessageBus
- `publish(event): Promise<void>`

### GameRules (Strategy)
- `IGameRules<TState, TMove>` — descrita na seção 6
- `IGameRulesRegistry.resolve(gameType): IGameRules` — resolve strategy do jogo da sessão

---

## 8. 💡 API de Tempo Real (WebSocket)

### Eventos de Entrada (client → server)
- `JOIN_GAME { sessionId, gameType, player }` — `gameType` necessário ao criar sessão nova
- `LEAVE_GAME { sessionId, playerId }`
- `START_GAME { sessionId }`
- `MAKE_MOVE { sessionId, playerId, payload }` — payload validado pelo `IGameRules` do jogo
- `RECONNECT { sessionId, playerId }`

### Eventos de Saída (server → client)
- `STATE_SYNC { session, gameState }` — sessão + estado específico do jogo
- `PLAYER_JOINED { player }`
- `GAME_STARTED { gameState }`
- `MOVE_APPLIED { gameState }`
- `ERROR { message }`

---

## 9. 🔗 Reconexão (Requisito Crítico)

### Identidade
- `playerId`
- `sessionId`
- `connectionId` (transiente)

### Regras
- Estado é **server-authoritative**
- Cliente apenas renderiza
- Ao reconectar:
  - validar playerId
  - reenviar `STATE_SYNC` completo

---

## 10. 🔄 Fluxos Principais

### Entrar na partida
1. Client → `JOIN_GAME`
2. UseCase valida e atualiza Aggregate
3. Repository salva (com version)
4. Event emitido
5. Broadcast `STATE_SYNC`

### Realizar jogada
1. Client → `MAKE_MOVE`
2. UseCase valida turno/regras
3. Atualiza Aggregate
4. Persiste + emite evento
5. Broadcast `MOVE_APPLIED`

### Reconectar
1. Client → `RECONNECT`
2. Server valida identidade
3. Retorna `STATE_SYNC`

---

## 11. 🧪 Estratégia de Testes

### Unit (≥ 70%)
- Regras do Aggregate
- Transições de estado
- Validações (turno, limites)

### Integração (20%)
- UseCase + Repository (inclui conflito de versão)

### E2E (10%)
- Fluxo completo (join → start → moves → reconnect)

---

## 12. 📊 Observabilidade (MVP+)

- Logs estruturados (JSON)
- Métricas:
  - tempo de resposta WS
  - taxa de erro por evento
  - conflitos de versão
- Alertas básicos (erros > threshold)

---

## 13. 🔐 Segurança (MVP)

- Identidade básica via `playerId` (UUID)
- Validação server-side de todas as ações
- Rate limiting simples por conexão

*(Fase 2: JWT / OAuth)*

---

## 14. 💰 Monetização (Preparação)

- Integração futura com pagamentos
- Modelos:
  - assinatura (premium)
  - itens cosméticos
  - torneios pagos

---

## 15. 🗺️ Roadmap

### Fase 1 – MVP (Local)
- InMemory Repository
- WebSocket (Socket.io)
- **Snake multiplayer** (real-time, tick-based)
- **War-Light multiplayer** (turn-based com fases)
- Reconexão funcional para ambos os jogos

### Fase 2 – Produção Inicial
- Persistência em PostgreSQL
- Cache com Redis
- Deploy containerizado

### Fase 3 – Escala
- Redis Cluster
- Pub/Sub
- Event Bus (Kafka/NATS)
- Matchmaking
- **CPU/IA por jogo** (perfis easy/normal/hard) — spec já existe em `snake_gamer/games/war-light/game.js` (CPU_PROFILES)

---

## 16. ⚠️ Riscos e Mitigações

- **Desync entre clientes**
  - Mitigar: server-authoritative + versioning
- **Race conditions**
  - Mitigar: optimistic locking
- **Queda de conexão**
  - Mitigar: fluxo de reconexão + snapshot de estado
- **Latência**
  - Mitigar: mensagens mínimas + broadcast eficiente

---

## 17. 🚫 Decisões Não Negociáveis

- Domínio isolado de frameworks
- Cliente nunca é fonte de verdade
- Toda ação validada no servidor
- Versionamento obrigatório no Aggregate

---

## 18. 🔧 Próximos Passos

1. ✅ Implementar Aggregate + testes (TDD)
2. ✅ Criar UseCases (Join, Start, Move, Reconnect, Leave)
3. ✅ Integrar InMemory Repository
4. **Definir `IGameRules` port + `GameRulesRegistry`**
5. **Refatorar `GameSession` para guardar `gameType` e `gameState`**
6. **Implementar `SnakeGameRules` e `WarLightGameRules`** (server-authoritative)
7. **WebSocket Gateway** (eventos JOIN/START/MOVE/RECONNECT/LEAVE) com resolução por `gameType`
8. **MessageBus in-memory** + fluxo de reconexão com TTL
9. **Bootstrap Angular SPA** substituindo hub vanilla
10. **Cliente WebSocket Angular + Lobby** (escolha de jogo)
11. **Snake e War-Light Angular components** (canvas/SVG)
12. **Observabilidade + E2E** com Playwright cobrindo ambos os jogos

> Referência funcional/visual: `c:\Users\lcmsc\workspace\snake_gamer\games\snake\index.html` e `c:\Users\lcmsc\workspace\snake_gamer\games\war-light\game.js`

---

## ✅ Definição de Pronto (DoD)

- Todos os testes do domínio passando
- Sessão multiplayer estável com ≥ 2 jogadores
- Reconexão funcional sem perda de estado
- Latência dentro do alvo definido
