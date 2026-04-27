import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { GameSession } from '../../domain/aggregates/GameSession';
import {
  GAME_SESSION_REPOSITORY,
  IGameSessionRepository,
} from '../../domain/ports/IGameSessionRepository';
import { IMessageBus, MESSAGE_BUS } from '../../domain/ports/IMessageBus';
import { PlayerId } from '../../domain/value-objects/PlayerId';
import { SessionId } from '../../domain/value-objects/SessionId';
import { PlayerLeftEvent } from '../events/domain-events';
import { UseCase } from './UseCase';

export interface LeaveGameRequest {
  sessionId: string;
  playerId: string;
}

export interface LeaveGameResponse {
  success: boolean;
  state: ReturnType<GameSession['toSnapshot']>;
}

@Injectable()
export class LeaveGameUseCase extends UseCase<LeaveGameRequest, LeaveGameResponse> {
  constructor(
    @Inject(GAME_SESSION_REPOSITORY) private readonly repo: IGameSessionRepository,
    @Inject(MESSAGE_BUS) private readonly bus: IMessageBus,
  ) {
    super();
  }

  async execute(req: LeaveGameRequest): Promise<LeaveGameResponse> {
    const sessionId = SessionId.from(req.sessionId);
    const session = await this.repo.findById(sessionId);

    if (!session) {
      throw new NotFoundException(`Session ${req.sessionId} not found`);
    }

    const expectedVersion = session.version;
    session.removePlayer(PlayerId.from(req.playerId));

    await this.repo.save(session, expectedVersion);
    await this.bus.publish(new PlayerLeftEvent(req.sessionId, req.playerId));

    return { success: true, state: session.toSnapshot() };
  }
}
