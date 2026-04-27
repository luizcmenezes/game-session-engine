# Guia de Extensão: Adicionando um Novo Jogo

Para adicionar um novo jogo ao Game Session Engine, siga estes passos:

## 1. Definir Regras no Backend
1. Crie uma nova pasta em `backend/src/infrastructure/game-rules/seu-jogo/`.
2. Implemente a interface `IGameRules<State, Move>`.
3. Defina os tipos de `Move` (ex: `JUMP`, `SHOOT`).
4. Implemente `getInitialState`, `applyMove` e opcionalmente `tick`.

## 2. Registrar o Jogo no Backend
1. Adicione sua classe de regras ao `GameRulesRegistry.ts`.
2. Registre o provedor no `app.module.ts`.

## 3. Implementar Componente no Frontend
1. Crie um novo componente Angular em `frontend/src/app/components/games/seu-jogo/`.
2. Defina os modelos de estado (`models/seu-jogo.models.ts`).
3. Use o `WebSocketService` para ouvir `STATE_SYNC` e enviar `MAKE_MOVE`.
4. Adicione a rota em `app.routes.ts`.

## 4. Registrar no Hub
1. Adicione o novo jogo à lista `games` no `LobbyComponent.ts`.
2. O hub irá renderizar o card automaticamente e habilitar o botão "Jogar".
