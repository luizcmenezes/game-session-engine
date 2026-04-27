import { SessionStatus } from '../../domain/aggregates/GameSession';
import { InMemoryGameSessionRepository } from '../../infrastructure/persistence/InMemoryGameSessionRepository';
import { SessionId } from '../../domain/value-objects/SessionId';
import { PlayerId } from '../../domain/value-objects/PlayerId';
import { JoinGameUseCase } from './JoinGameUseCase';
import { StartGameUseCase } from './StartGameUseCase';

const makeBus = () => ({ publish: jest.fn().mockResolvedValue(undefined) });

describe('StartGameUseCase', () => {
  let repo: InMemoryGameSessionRepository;
  let joinUseCase: JoinGameUseCase;
  let startUseCase: StartGameUseCase;
  let bus: ReturnType<typeof makeBus>;

  beforeEach(() => {
    repo = new InMemoryGameSessionRepository();
    bus = makeBus();
    joinUseCase = new JoinGameUseCase(repo, bus);
    startUseCase = new StartGameUseCase(repo, bus);
  });

  it('inicia jogo com 2+ jogadores', async () => {
    const sessionId = SessionId.create().getValue();
    await joinUseCase.execute({ sessionId, playerId: PlayerId.create().getValue(), playerName: 'Alice' });
    await joinUseCase.execute({ sessionId, playerId: PlayerId.create().getValue(), playerName: 'Bob' });

    const result = await startUseCase.execute({ sessionId });

    expect(result.success).toBe(true);
    expect(result.state.status).toBe(SessionStatus.STARTED);
  });

  it('falha com menos de 2 jogadores', async () => {
    const sessionId = SessionId.create().getValue();
    await joinUseCase.execute({ sessionId, playerId: PlayerId.create().getValue(), playerName: 'Alice' });

    await expect(startUseCase.execute({ sessionId })).rejects.toThrow('Need at least 2 players');
  });

  it('lança erro se sessão não existe', async () => {
    await expect(
      startUseCase.execute({ sessionId: SessionId.create().getValue() }),
    ).rejects.toThrow('not found');
  });

  it('emite GameStartedEvent', async () => {
    const sessionId = SessionId.create().getValue();
    await joinUseCase.execute({ sessionId, playerId: PlayerId.create().getValue(), playerName: 'Alice' });
    await joinUseCase.execute({ sessionId, playerId: PlayerId.create().getValue(), playerName: 'Bob' });
    await startUseCase.execute({ sessionId });

    expect(bus.publish).toHaveBeenCalledWith(
      expect.objectContaining({ aggregateId: sessionId }),
    );
  });
});
