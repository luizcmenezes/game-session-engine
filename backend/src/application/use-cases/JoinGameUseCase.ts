import { Inject, Injectable } from '@nestjs/common';
import { GameSession } from '../../domain/aggregates/GameSession';
import { Player } from '../../domain/entities/Player';
import {
  GAME_SESSION_REPOSITORY,
  IGameSessionRepository,
} from '../../domain/ports/IGameSessionRepository';
import { IMessageBus, MESSAGE_BUS } from '../../domain/ports/IMessageBus';
import { PlayerId } from '../../domain/value-objects/PlayerId';
import { SessionId } from '../../domain/value-objects/SessionId';
import { PlayerJoinedEvent } from '../events/domain-events';
import { UseCase } from './UseCase';

export interface JoinGameRequest {
  sessionId: string;
  playerId: string;
  playerName: string;
}

export interface JoinGameResponse {
  success: boolean;
  state: ReturnType<GameSession['toSnapshot']>;
}

@Injectable()
export class JoinGameUseCase extends UseCase<JoinGameRequest, JoinGameResponse> {
  constructor(
    @Inject(GAME_SESSION_REPOSITORY) private readonly repo: IGameSessionRepository,
    @Inject(MESSAGE_BUS) private readonly bus: IMessageBus,
  ) {
    super();
  }

  async execute(req: JoinGameRequest): Promise<JoinGameResponse> {
    const sessionId = SessionId.from(req.sessionId);
    let session = await this.repo.findById(sessionId);
    const expectedVersion = session ? session.version : 0;

    if (!session) {
      session = GameSession.create(sessionId);
    }

    const player = new Player(PlayerId.from(req.playerId), req.playerName);
    session.addPlayer(player);

    await this.repo.save(session, expectedVersion);
    await this.bus.publish(new PlayerJoinedEvent(req.sessionId, req.playerId));

    return { success: true, state: session.toSnapshot() };
  }
}
