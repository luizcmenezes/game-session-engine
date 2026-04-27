import { GameSession, SessionStatus } from './GameSession';
import { Player } from '../entities/Player';
import { PlayerId } from '../value-objects/PlayerId';
import { SessionId } from '../value-objects/SessionId';

const makePlayer = (name = 'Player') =>
  new Player(PlayerId.create(), name);

describe('GameSession', () => {
  describe('create', () => {
    it('cria sessão vazia com status WAITING e version 0', () => {
      const session = GameSession.create();
      expect(session.getPlayers()).toHaveLength(0);
      expect(session.getStatus()).toBe(SessionStatus.WAITING);
      expect(session.version).toBe(0);
    });

    it('aceita SessionId externo', () => {
      const id = SessionId.create();
      const session = GameSession.create(id);
      expect(session.id.equals(id)).toBe(true);
    });
  });

  describe('addPlayer', () => {
    it('adiciona jogador e incrementa version', () => {
      const session = GameSession.create();
      session.addPlayer(makePlayer('Alice'));
      expect(session.getPlayers()).toHaveLength(1);
      expect(session.version).toBe(1);
    });

    it('adiciona até 4 jogadores', () => {
      const session = GameSession.create();
      for (let i = 0; i < 4; i++) {
        session.addPlayer(makePlayer(`P${i}`));
      }
      expect(session.getPlayers()).toHaveLength(4);
      expect(session.version).toBe(4);
    });

    it('lança erro ao adicionar 5º jogador', () => {
      const session = GameSession.create();
      for (let i = 0; i < 4; i++) {
        session.addPlayer(makePlayer(`P${i}`));
      }
      expect(() => session.addPlayer(makePlayer('Extra'))).toThrow('Session is full');
    });

    it('lança erro ao adicionar jogador duplicado', () => {
      const session = GameSession.create();
      const player = makePlayer('Alice');
      session.addPlayer(player);
      expect(() => session.addPlayer(player)).toThrow('Player already in session');
    });

    it('lança erro ao adicionar jogador após STARTED', () => {
      const session = GameSession.create();
      session.addPlayer(makePlayer('Alice'));
      session.addPlayer(makePlayer('Bob'));
      session.start();
      expect(() => session.addPlayer(makePlayer('Charlie'))).toThrow(
        'Cannot join after game started',
      );
    });

    it('lança erro ao adicionar jogador após FINISHED', () => {
      const session = GameSession.create();
      session.addPlayer(makePlayer('Alice'));
      session.addPlayer(makePlayer('Bob'));
      session.start();
      session.finish();
      expect(() => session.addPlayer(makePlayer('Charlie'))).toThrow(
        'Cannot join after game started',
      );
    });
  });

  describe('removePlayer', () => {
    it('remove jogador existente e incrementa version', () => {
      const session = GameSession.create();
      const player = makePlayer('Alice');
      session.addPlayer(player);
      session.removePlayer(player.id);
      expect(session.getPlayers()).toHaveLength(0);
      expect(session.version).toBe(2);
    });

    it('lança erro ao remover jogador inexistente', () => {
      const session = GameSession.create();
      expect(() => session.removePlayer(PlayerId.create())).toThrow('Player not found');
    });
  });

  describe('start', () => {
    it('inicia sessão com 2 jogadores e incrementa version', () => {
      const session = GameSession.create();
      session.addPlayer(makePlayer('Alice'));
      session.addPlayer(makePlayer('Bob'));
      session.start();
      expect(session.getStatus()).toBe(SessionStatus.STARTED);
      expect(session.version).toBe(3);
    });

    it('lança erro ao iniciar com menos de 2 jogadores', () => {
      const session = GameSession.create();
      session.addPlayer(makePlayer('Alice'));
      expect(() => session.start()).toThrow('Need at least 2 players to start');
    });

    it('lança erro ao iniciar sessão já iniciada', () => {
      const session = GameSession.create();
      session.addPlayer(makePlayer('Alice'));
      session.addPlayer(makePlayer('Bob'));
      session.start();
      expect(() => session.start()).toThrow('Game already started');
    });

    it('lança erro ao iniciar sessão já finalizada', () => {
      const session = GameSession.create();
      session.addPlayer(makePlayer('Alice'));
      session.addPlayer(makePlayer('Bob'));
      session.start();
      session.finish();
      expect(() => session.start()).toThrow('Game already started');
    });
  });

  describe('finish', () => {
    it('finaliza sessão em andamento e incrementa version', () => {
      const session = GameSession.create();
      session.addPlayer(makePlayer('Alice'));
      session.addPlayer(makePlayer('Bob'));
      session.start();
      session.finish();
      expect(session.getStatus()).toBe(SessionStatus.FINISHED);
    });

    it('lança erro ao finalizar sessão WAITING', () => {
      const session = GameSession.create();
      expect(() => session.finish()).toThrow('Game is not in progress');
    });

    it('lança erro ao finalizar sessão já finalizada', () => {
      const session = GameSession.create();
      session.addPlayer(makePlayer('Alice'));
      session.addPlayer(makePlayer('Bob'));
      session.start();
      session.finish();
      expect(() => session.finish()).toThrow('Game is not in progress');
    });
  });

  describe('applyMove', () => {
    it('aplica movimento e incrementa version', () => {
      const session = GameSession.create();
      const player = makePlayer('Alice');
      session.addPlayer(player);
      session.addPlayer(makePlayer('Bob'));
      session.start();
      const versionBefore = session.version;
      session.applyMove({ playerId: player.id.getValue(), data: {} });
      expect(session.version).toBe(versionBefore + 1);
    });

    it('lança erro ao aplicar movimento fora de STARTED', () => {
      const session = GameSession.create();
      const player = makePlayer('Alice');
      session.addPlayer(player);
      expect(() =>
        session.applyMove({ playerId: player.id.getValue(), data: {} }),
      ).toThrow('Game is not in progress');
    });

    it('lança erro ao aplicar movimento de jogador fora da sessão', () => {
      const session = GameSession.create();
      session.addPlayer(makePlayer('Alice'));
      session.addPlayer(makePlayer('Bob'));
      session.start();
      expect(() =>
        session.applyMove({ playerId: PlayerId.create().getValue(), data: {} }),
      ).toThrow('Player not in session');
    });
  });

  describe('toSnapshot / restore', () => {
    it('serializa e restaura sessão corretamente', () => {
      const session = GameSession.create();
      const player = makePlayer('Alice');
      session.addPlayer(player);
      session.addPlayer(makePlayer('Bob'));
      session.start();

      const snapshot = session.toSnapshot();
      const restored = GameSession.restore(snapshot);

      expect(restored.id.equals(session.id)).toBe(true);
      expect(restored.getStatus()).toBe(SessionStatus.STARTED);
      expect(restored.getPlayers()).toHaveLength(2);
      expect(restored.version).toBe(session.version);
    });

    it('preserva gameType e gameState no snapshot', () => {
      const session = GameSession.create(undefined, 'snake');
      session.addPlayer(makePlayer('Alice'));
      session.addPlayer(makePlayer('Bob'));

      const mockRules = {
        getInitialState: () => ({ grid: '20x20', snakes: [] }),
        applyMove: (s: unknown) => s,
        isGameOver: () => false,
        getValidMoves: () => [],
        getWinner: () => null,
      };
      session.start(mockRules);

      const snapshot = session.toSnapshot();
      expect(snapshot.gameType).toBe('snake');
      expect(snapshot.gameState).toEqual({ grid: '20x20', snakes: [] });

      const restored = GameSession.restore(snapshot);
      expect(restored.gameType).toBe('snake');
      expect(restored.getGameState()).toEqual({ grid: '20x20', snakes: [] });
    });
  });

  describe('IGameRules integration', () => {
    const makeRules = (overrides: Partial<{
      getInitialState: () => unknown;
      applyMove: (s: unknown, m: unknown, p: string) => unknown;
      isGameOver: (s: unknown) => boolean;
    }> = {}) => ({
      getInitialState: () => ({ started: true }),
      applyMove: (s: unknown) => s,
      isGameOver: () => false,
      getValidMoves: () => [],
      getWinner: () => null,
      ...overrides,
    });

    it('start com rules inicializa gameState', () => {
      const session = GameSession.create(undefined, 'test-game');
      session.addPlayer(makePlayer('Alice'));
      session.addPlayer(makePlayer('Bob'));
      session.start(makeRules({ getInitialState: () => ({ turn: 0 }) }));

      expect(session.getGameState()).toEqual({ turn: 0 });
    });

    it('applyMove com rules atualiza gameState', () => {
      const session = GameSession.create(undefined, 'test-game');
      const player = makePlayer('Alice');
      session.addPlayer(player);
      session.addPlayer(makePlayer('Bob'));
      session.start(makeRules());

      session.applyMove(
        { playerId: player.id.getValue(), data: { dir: 'UP' } },
        makeRules({ applyMove: (_s, m) => ({ applied: m }) }),
      );

      expect(session.getGameState()).toEqual({ applied: { dir: 'UP' } });
    });

    it('applyMove finaliza sessão quando isGameOver retorna true', () => {
      const session = GameSession.create(undefined, 'test-game');
      const player = makePlayer('Alice');
      session.addPlayer(player);
      session.addPlayer(makePlayer('Bob'));
      session.start(makeRules());

      session.applyMove(
        { playerId: player.id.getValue(), data: {} },
        makeRules({ isGameOver: () => true }),
      );

      expect(session.getStatus()).toBe(SessionStatus.FINISHED);
    });
  });
});

describe('SessionId', () => {
  it('cria ID único a cada chamada', () => {
    const a = SessionId.create();
    const b = SessionId.create();
    expect(a.equals(b)).toBe(false);
  });

  it('lança erro para ID vazio', () => {
    expect(() => SessionId.from('')).toThrow('SessionId cannot be empty');
  });

  it('restaura a partir de string', () => {
    const id = SessionId.create();
    const restored = SessionId.from(id.getValue());
    expect(restored.equals(id)).toBe(true);
  });

  it('toString retorna o valor string', () => {
    const id = SessionId.create();
    expect(id.toString()).toBe(id.getValue());
  });
});

describe('PlayerId', () => {
  it('cria ID único a cada chamada', () => {
    const a = PlayerId.create();
    const b = PlayerId.create();
    expect(a.equals(b)).toBe(false);
  });

  it('lança erro para ID vazio', () => {
    expect(() => PlayerId.from('')).toThrow('PlayerId cannot be empty');
  });

  it('toString retorna o valor string', () => {
    const id = PlayerId.create();
    expect(id.toString()).toBe(id.getValue());
  });
});

describe('Player', () => {
  it('cria jogador com score padrão 0', () => {
    const player = new Player(PlayerId.create(), 'Alice');
    expect(player.score).toBe(0);
    expect(player.name).toBe('Alice');
  });

  it('lança erro para nome vazio', () => {
    expect(() => new Player(PlayerId.create(), '')).toThrow('Player name cannot be empty');
  });
});
