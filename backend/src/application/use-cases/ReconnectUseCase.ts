import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { GameSession } from '../../domain/aggregates/GameSession';
import {
  GAME_SESSION_REPOSITORY,
  IGameSessionRepository,
} from '../../domain/ports/IGameSessionRepository';
import { IMessageBus, MESSAGE_BUS } from '../../domain/ports/IMessageBus';
import { SessionId } from '../../domain/value-objects/SessionId';
import { PlayerReconnectedEvent } from '../events/domain-events';
import { UseCase } from './UseCase';

export interface ReconnectRequest {
  sessionId: string;
  playerId: string;
}

export interface ReconnectResponse {
  success: boolean;
  state: ReturnType<GameSession['toSnapshot']>;
}

@Injectable()
export class ReconnectUseCase extends UseCase<ReconnectRequest, ReconnectResponse> {
  constructor(
    @Inject(GAME_SESSION_REPOSITORY) private readonly repo: IGameSessionRepository,
    @Inject(MESSAGE_BUS) private readonly bus: IMessageBus,
  ) {
    super();
  }

  async execute(req: ReconnectRequest): Promise<ReconnectResponse> {
    const sessionId = SessionId.from(req.sessionId);
    const session = await this.repo.findById(sessionId);

    if (!session) {
      throw new NotFoundException(`Session ${req.sessionId} not found`);
    }

    const playerExists = session.getPlayers().some(
      (p) => p.id.getValue() === req.playerId,
    );

    if (!playerExists) {
      throw new NotFoundException(`Player ${req.playerId} not in session`);
    }

    await this.bus.publish(new PlayerReconnectedEvent(req.sessionId, req.playerId));

    return { success: true, state: session.toSnapshot() };
  }
}
