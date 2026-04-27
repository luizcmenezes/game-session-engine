import { SessionId } from '../value-objects/SessionId';
import { PlayerId } from '../value-objects/PlayerId';
import { Player } from '../entities/Player';
import { IGameRules } from '../ports/IGameRules';

export enum SessionStatus {
  WAITING = 'WAITING',
  STARTED = 'STARTED',
  FINISHED = 'FINISHED',
}

export interface GameMove {
  playerId: string;
  data: unknown;
}

export interface GameSessionSnapshot {
  id: string;
  gameType: string;
  players: Array<{ id: string; name: string; score: number }>;
  status: SessionStatus;
  version: number;
  gameState: unknown;
}

export class GameSession {
  private static readonly MAX_PLAYERS = 4;
  private static readonly MIN_PLAYERS_TO_START = 2;

  private constructor(
    public readonly id: SessionId,
    public readonly gameType: string,
    private players: Player[],
    private status: SessionStatus,
    public version: number,
    private gameState: unknown,
  ) {}

  static create(id?: SessionId, gameType = 'unknown'): GameSession {
    return new GameSession(
      id ?? SessionId.create(),
      gameType,
      [],
      SessionStatus.WAITING,
      0,
      null,
    );
  }

  static restore(snapshot: GameSessionSnapshot): GameSession {
    const id = SessionId.from(snapshot.id);
    const players = snapshot.players.map(
      (p) => new Player(PlayerId.from(p.id), p.name, p.score),
    );
    return new GameSession(
      id,
      snapshot.gameType ?? 'unknown',
      players,
      snapshot.status,
      snapshot.version,
      snapshot.gameState ?? null,
    );
  }

  addPlayer(player: Player): void {
    if (this.status !== SessionStatus.WAITING) {
      throw new Error('Cannot join after game started');
    }
    if (this.players.length >= GameSession.MAX_PLAYERS) {
      throw new Error('Session is full');
    }
    if (this.players.some((p) => p.id.equals(player.id))) {
      throw new Error('Player already in session');
    }
    this.players.push(player);
    this.version++;
  }

  removePlayer(playerId: PlayerId): void {
    const index = this.players.findIndex((p) => p.id.equals(playerId));
    if (index === -1) {
      throw new Error('Player not found');
    }
    this.players.splice(index, 1);
    this.version++;
  }

  start(rules?: IGameRules<unknown, unknown>): void {
    if (this.status !== SessionStatus.WAITING) {
      throw new Error('Game already started');
    }
    if (this.players.length < GameSession.MIN_PLAYERS_TO_START) {
      throw new Error('Need at least 2 players to start');
    }
    this.status = SessionStatus.STARTED;
    if (rules) {
      const playerIds = this.players.map((p) => p.id.getValue());
      this.gameState = rules.getInitialState(playerIds);
    }
    this.version++;
  }

  finish(): void {
    if (this.status !== SessionStatus.STARTED) {
      throw new Error('Game is not in progress');
    }
    this.status = SessionStatus.FINISHED;
    this.version++;
  }

  applyMove(move: GameMove, rules?: IGameRules<unknown, unknown>): void {
    if (this.status !== SessionStatus.STARTED) {
      throw new Error('Game is not in progress');
    }
    const player = this.players.find(
      (p) => p.id.getValue() === move.playerId,
    );
    if (!player) {
      throw new Error('Player not in session');
    }
    if (rules) {
      this.gameState = rules.applyMove(this.gameState, move.data, move.playerId);
      if (rules.isGameOver(this.gameState)) {
        this.status = SessionStatus.FINISHED;
      }
    }
    this.version++;
  }

  getPlayers(): readonly Player[] {
    return this.players;
  }

  getStatus(): SessionStatus {
    return this.status;
  }

  getGameState(): unknown {
    return this.gameState;
  }

  toSnapshot(): GameSessionSnapshot {
    return {
      id: this.id.getValue(),
      gameType: this.gameType,
      players: this.players.map((p) => ({
        id: p.id.getValue(),
        name: p.name,
        score: p.score,
      })),
      status: this.status,
      version: this.version,
      gameState: this.gameState,
    };
  }
}
