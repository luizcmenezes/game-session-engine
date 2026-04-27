import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JoinGameUseCase } from './application/use-cases/JoinGameUseCase';
import { LeaveGameUseCase } from './application/use-cases/LeaveGameUseCase';
import { MakeMoveUseCase } from './application/use-cases/MakeMoveUseCase';
import { ReconnectUseCase } from './application/use-cases/ReconnectUseCase';
import { StartGameUseCase } from './application/use-cases/StartGameUseCase';
import { GAME_SESSION_REPOSITORY } from './domain/ports/IGameSessionRepository';
import { GAME_RULES_REGISTRY } from './domain/ports/IGameRules';
import { MESSAGE_BUS } from './domain/ports/IMessageBus';
import { GameRulesRegistry } from './infrastructure/game-rules/GameRulesRegistry';
import { SnakeGameRules } from './infrastructure/game-rules/snake/SnakeGameRules';
import { WarLightGameRules } from './infrastructure/game-rules/war-light/WarLightGameRules';
import { InMemoryGameSessionRepository } from './infrastructure/persistence/InMemoryGameSessionRepository';
import { NullMessageBus } from './infrastructure/messaging/NullMessageBus';

import { GameGateway } from './infrastructure/websocket/GameGateway';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: GAME_SESSION_REPOSITORY, useClass: InMemoryGameSessionRepository },
    { provide: MESSAGE_BUS, useClass: NullMessageBus },
    { provide: GAME_RULES_REGISTRY, useClass: GameRulesRegistry },
    SnakeGameRules,
    WarLightGameRules,
    JoinGameUseCase,
    StartGameUseCase,
    MakeMoveUseCase,
    ReconnectUseCase,
    LeaveGameUseCase,
    GameGateway,
  ],
  exports: [GAME_SESSION_REPOSITORY, MESSAGE_BUS, GAME_RULES_REGISTRY],
})
export class AppModule {}
