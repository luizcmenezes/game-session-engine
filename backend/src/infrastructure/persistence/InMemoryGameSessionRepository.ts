import { Injectable } from '@nestjs/common';
import { GameSession } from '../../domain/aggregates/GameSession';
import { IGameSessionRepository } from '../../domain/ports/IGameSessionRepository';
import { SessionId } from '../../domain/value-objects/SessionId';

@Injectable()
export class InMemoryGameSessionRepository implements IGameSessionRepository {
  private readonly sessions = new Map<string, GameSession>();

  async save(session: GameSession, expectedVersion: number): Promise<void> {
    const id = session.id.getValue();
    const existing = this.sessions.get(id);

    if (existing !== undefined && existing.version !== expectedVersion) {
      throw new Error(
        `Version conflict: expected ${expectedVersion}, got ${existing.version}`,
      );
    }

    this.sessions.set(id, GameSession.restore(session.toSnapshot()));
  }

  async findById(id: SessionId): Promise<GameSession | null> {
    const session = this.sessions.get(id.getValue());
    if (!session) return null;
    return GameSession.restore(session.toSnapshot());
  }

  async findAll(): Promise<GameSession[]> {
    return Array.from(this.sessions.values()).map((s) =>
      GameSession.restore(s.toSnapshot()),
    );
  }

  async delete(id: SessionId): Promise<void> {
    this.sessions.delete(id.getValue());
  }
}
