import { SnakeGameRules, SnakeState } from './SnakeGameRules';

describe('SnakeGameRules', () => {
  let rules: SnakeGameRules;
  const p1 = 'player-1';
  const p2 = 'player-2';

  beforeEach(() => {
    rules = new SnakeGameRules();
  });

  describe('getInitialState', () => {
    it('cria estado com jogadores e maçã', () => {
      const state = rules.getInitialState([p1, p2]);
      expect(state.players).toHaveLength(2);
      expect(state.players[0].playerId).toBe(p1);
      expect(state.players[1].playerId).toBe(p2);
      expect(state.players[0].snake).toHaveLength(3);
      expect(state.apple).toBeDefined();
      expect(state.running).toBe(true);
      expect(state.tick).toBe(0);
    });

    it('todos os jogadores iniciam vivos com direção RIGHT', () => {
      const state = rules.getInitialState([p1]);
      const player = state.players[0];
      expect(player.alive).toBe(true);
      expect(player.direction).toEqual({ x: 1, y: 0 });
      expect(player.score).toBe(0);
    });

    it('maçã não está em posição ocupada por cobras', () => {
      const state = rules.getInitialState([p1, p2]);
      const occupied = new Set(
        state.players.flatMap((p) => p.snake).map((s) => `${s.x},${s.y}`),
      );
      expect(occupied.has(`${state.apple.x},${state.apple.y}`)).toBe(false);
    });
  });

  describe('applyMove', () => {
    it('enfileira nova direção válida', () => {
      const state = rules.getInitialState([p1]);
      const next = rules.applyMove(state, { direction: 'UP' }, p1);
      expect(next.players[0].nextDirection).toEqual({ x: 0, y: -1 });
    });

    it('ignora direção oposta (anti-reversão)', () => {
      const state = rules.getInitialState([p1]); // inicia indo RIGHT
      const next = rules.applyMove(state, { direction: 'LEFT' }, p1);
      expect(next.players[0].nextDirection).toEqual({ x: 1, y: 0 }); // mantém RIGHT
    });

    it('não afeta jogador morto', () => {
      const state = rules.getInitialState([p1]);
      state.players[0].alive = false;
      const next = rules.applyMove(state, { direction: 'UP' }, p1);
      expect(next.players[0].nextDirection).toEqual({ x: 1, y: 0 });
    });
  });

  describe('tick', () => {
    it('avança a cobra na direção atual', () => {
      const state = rules.getInitialState([p1]);
      const head0 = state.players[0].snake[0];
      const next = rules.tick(state);
      expect(next.players[0].snake[0]).toEqual({ x: head0.x + 1, y: head0.y });
      expect(next.tick).toBe(1);
    });

    it('cobra morre ao sair pelo topo', () => {
      const state = rules.getInitialState([p1]);
      state.players[0].snake = [{ x: 0, y: 0 }];
      state.players[0].direction = { x: 0, y: -1 };
      state.players[0].nextDirection = { x: 0, y: -1 };
      const next = rules.tick(state);
      expect(next.players[0].alive).toBe(false);
    });

    it('cobra morre ao sair pela direita', () => {
      const state = rules.getInitialState([p1]);
      state.players[0].snake = [{ x: 19, y: 5 }];
      state.players[0].direction = { x: 1, y: 0 };
      state.players[0].nextDirection = { x: 1, y: 0 };
      const next = rules.tick(state);
      expect(next.players[0].alive).toBe(false);
    });

    it('cobra morre ao colidir com próprio corpo', () => {
      const state = rules.getInitialState([p1]);
      // Coloca cabeça adjacente ao próprio corpo
      state.players[0].snake = [
        { x: 5, y: 5 },
        { x: 5, y: 6 },
        { x: 6, y: 6 },
        { x: 6, y: 5 },
      ];
      state.players[0].direction = { x: 0, y: 1 };
      state.players[0].nextDirection = { x: 0, y: 1 };
      const next = rules.tick(state);
      expect(next.players[0].alive).toBe(false);
    });

    it('cobra cresce e score aumenta ao comer maçã', () => {
      const state = rules.getInitialState([p1]);
      const head = state.players[0].snake[0];
      // Posiciona maçã exatamente onde a cobra vai
      state.apple = { x: head.x + 1, y: head.y };
      const lengthBefore = state.players[0].snake.length;
      const next = rules.tick(state);
      expect(next.players[0].snake).toHaveLength(lengthBefore + 1);
      expect(next.players[0].score).toBe(1);
    });

    it('maçã reposicionada após ser comida', () => {
      const state = rules.getInitialState([p1]);
      const head = state.players[0].snake[0];
      state.apple = { x: head.x + 1, y: head.y };
      const next = rules.tick(state);
      const newApple = next.apple;
      expect(
        newApple.x !== state.apple.x || newApple.y !== state.apple.y,
      ).toBe(true);
    });

    it('não avança estado já finalizado', () => {
      const state = rules.getInitialState([p1]);
      state.running = false;
      const next = rules.tick(state);
      expect(next.tick).toBe(0);
    });
  });

  describe('isGameOver / getWinner', () => {
    it('jogo em andamento: isGameOver false, getWinner null', () => {
      const state = rules.getInitialState([p1, p2]);
      expect(rules.isGameOver(state)).toBe(false);
      expect(rules.getWinner(state)).toBeNull();
    });

    it('identifica vencedor quando um jogador morre', () => {
      const state = rules.getInitialState([p1, p2]);
      state.players[1].alive = false;
      // Forçar fim via tick com jogador fora da parede
      state.players[0].snake = [{ x: 19, y: 5 }];
      state.players[0].direction = { x: 1, y: 0 };
      state.players[0].nextDirection = { x: 1, y: 0 };
      const next = rules.tick(state);
      // p2 morto, p1 também morreu → running = false
      expect(next.running).toBe(false);
    });

    it('getWinner retorna jogador com maior score em empate de mortes', () => {
      const state = rules.getInitialState([p1, p2]) as SnakeState;
      state.running = false;
      state.players[0].alive = false;
      state.players[1].alive = false;
      state.players[0].score = 3;
      state.players[1].score = 7;
      expect(rules.getWinner(state)).toBe(p2);
    });
  });

  describe('getValidMoves', () => {
    it('retorna as 4 direções', () => {
      const state = rules.getInitialState([p1]);
      const moves = rules.getValidMoves(state, p1);
      expect(moves).toHaveLength(4);
      expect(moves.map((m) => m.direction)).toEqual(
        expect.arrayContaining(['UP', 'DOWN', 'LEFT', 'RIGHT']),
      );
    });
  });
});
