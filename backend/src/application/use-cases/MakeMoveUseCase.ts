import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { GameSession } from '../../domain/aggregates/GameSession';
import {
  GAME_SESSION_REPOSITORY,
  IGameSessionRepository,
} from '../../domain/ports/IGameSessionRepository';
import { IMessageBus, MESSAGE_BUS } from '../../domain/ports/IMessageBus';
import { SessionId } from '../../domain/value-objects/SessionId';
import { MoveAppliedEvent } from '../events/domain-events';
import { UseCase } from './UseCase';

export interface MakeMoveRequest {
  sessionId: string;
  playerId: string;
  data: unknown;
}

export interface MakeMoveResponse {
  success: boolean;
  state: ReturnType<GameSession['toSnapshot']>;
}

@Injectable()
export class MakeMoveUseCase extends UseCase<MakeMoveRequest, MakeMoveResponse> {
  constructor(
    @Inject(GAME_SESSION_REPOSITORY) private readonly repo: IGameSessionRepository,
    @Inject(MESSAGE_BUS) private readonly bus: IMessageBus,
  ) {
    super();
  }

  async execute(req: MakeMoveRequest): Promise<MakeMoveResponse> {
    const sessionId = SessionId.from(req.sessionId);
    const session = await this.repo.findById(sessionId);

    if (!session) {
      throw new NotFoundException(`Session ${req.sessionId} not found`);
    }

    const expectedVersion = session.version;
    session.applyMove({ playerId: req.playerId, data: req.data });

    await this.repo.save(session, expectedVersion);
    await this.bus.publish(new MoveAppliedEvent(req.sessionId, req.playerId, req.data));

    return { success: true, state: session.toSnapshot() };
  }
}
