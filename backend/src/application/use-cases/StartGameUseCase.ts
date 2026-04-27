import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { GameSession } from '../../domain/aggregates/GameSession';
import {
  GAME_SESSION_REPOSITORY,
  IGameSessionRepository,
} from '../../domain/ports/IGameSessionRepository';
import { IMessageBus, MESSAGE_BUS } from '../../domain/ports/IMessageBus';
import { SessionId } from '../../domain/value-objects/SessionId';
import { GameStartedEvent } from '../events/domain-events';
import { UseCase } from './UseCase';

export interface StartGameRequest {
  sessionId: string;
}

export interface StartGameResponse {
  success: boolean;
  state: ReturnType<GameSession['toSnapshot']>;
}

@Injectable()
export class StartGameUseCase extends UseCase<StartGameRequest, StartGameResponse> {
  constructor(
    @Inject(GAME_SESSION_REPOSITORY) private readonly repo: IGameSessionRepository,
    @Inject(MESSAGE_BUS) private readonly bus: IMessageBus,
  ) {
    super();
  }

  async execute(req: StartGameRequest): Promise<StartGameResponse> {
    const sessionId = SessionId.from(req.sessionId);
    const session = await this.repo.findById(sessionId);

    if (!session) {
      throw new NotFoundException(`Session ${req.sessionId} not found`);
    }

    const expectedVersion = session.version;
    session.start();

    await this.repo.save(session, expectedVersion);
    await this.bus.publish(new GameStartedEvent(req.sessionId));

    return { success: true, state: session.toSnapshot() };
  }
}
