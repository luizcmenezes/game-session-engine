# Game Session Engine (Multiplayer MVP)

Motor de sessões de jogo multiplayer em tempo real, utilizando Clean Architecture no Backend (NestJS) e Angular 18+ no Frontend.

## 🚀 Tecnologias

- **Backend:** NestJS, Socket.io, TypeScript.
- **Frontend:** Angular 18 (Standalone Components, Control Flow), RxJS, Socket.io-client.
- **Arquitetura:** Clean Architecture (Domain, Application, Infrastructure), Server-Authoritative.

## 📦 Estrutura do Projeto

- `backend/`: Servidor NestJS com a lógica de jogo e gerenciamento de sessões.
- `frontend/`: Aplicação Angular (SPA) com o lobby e os componentes de jogo.
- `games/`: Protótipos originais em Vanilla JS (referência).

## 🛠️ Como Executar

### Pré-requisitos
- Node.js 18+
- npm 9+

### Backend
1. Entre na pasta `backend`: `cd backend`
2. Instale as dependências: `npm install`
3. Inicie o servidor: `npm run start:dev` (roda em `http://localhost:3000`)

### Frontend
1. Entre na pasta `frontend`: `cd frontend`
2. Instale as dependências: `npm install`
3. Inicie a aplicação: `npm run start` (roda em `http://localhost:4200`)

## 🎮 Jogos Disponíveis

1. **Snake:** Clássico multiplayer em tempo real.
2. **War Light:** Estratégia por turnos em mapa mundi.

## 🏗️ Decisões Arquiteturais

- **Server-Authoritative:** Toda a lógica de colisão (Snake) e combate (War) é processada no servidor. O cliente apenas envia inputs e renderiza o estado recebido.
- **Clean Architecture:** Independência de frameworks. A lógica de regras de jogo (`IGameRules`) está no domínio/infraestrutura e não depende do WebSocket.
- **Reconexão:** Implementado fluxo de reconciliação de sessão via `playerId` e `sessionId` persistidos no `localStorage`.

## 📈 Roadmap Fase 2

Veja o arquivo [ROADMAP.md](./ROADMAP.md) para detalhes da próxima fase.

## 📄 Licença
MIT
