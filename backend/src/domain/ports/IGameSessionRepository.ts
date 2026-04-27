import { GameSession } from '../aggregates/GameSession';
import { SessionId } from '../value-objects/SessionId';

export interface IGameSessionRepository {
  findById(id: SessionId): Promise<GameSession | null>;
  save(session: GameSession, expectedVersion: number): Promise<void>;
  findAll(): Promise<GameSession[]>;
  delete(id: SessionId): Promise<void>;
}

export const GAME_SESSION_REPOSITORY = Symbol('IGameSessionRepository');
