import { InMemoryGameSessionRepository } from '../../infrastructure/persistence/InMemoryGameSessionRepository';
import { SessionId } from '../../domain/value-objects/SessionId';
import { PlayerId } from '../../domain/value-objects/PlayerId';
import { JoinGameUseCase } from './JoinGameUseCase';
import { ReconnectUseCase } from './ReconnectUseCase';

const makeBus = () => ({ publish: jest.fn().mockResolvedValue(undefined) });

describe('ReconnectUseCase', () => {
  let repo: InMemoryGameSessionRepository;
  let joinUseCase: JoinGameUseCase;
  let reconnectUseCase: ReconnectUseCase;
  let bus: ReturnType<typeof makeBus>;

  beforeEach(() => {
    repo = new InMemoryGameSessionRepository();
    bus = makeBus();
    joinUseCase = new JoinGameUseCase(repo, bus);
    reconnectUseCase = new ReconnectUseCase(repo, bus);
  });

  it('retorna estado completo da sessão', async () => {
    const sessionId = SessionId.create().getValue();
    const playerId = PlayerId.create().getValue();
    await joinUseCase.execute({ sessionId, playerId, playerName: 'Alice' });

    const result = await reconnectUseCase.execute({ sessionId, playerId });

    expect(result.success).toBe(true);
    expect(result.state.players).toHaveLength(1);
  });

  it('falha para jogador não registrado na sessão', async () => {
    const sessionId = SessionId.create().getValue();
    await joinUseCase.execute({ sessionId, playerId: PlayerId.create().getValue(), playerName: 'Alice' });

    await expect(
      reconnectUseCase.execute({ sessionId, playerId: PlayerId.create().getValue() }),
    ).rejects.toThrow('not in session');
  });

  it('falha para sessão inexistente', async () => {
    await expect(
      reconnectUseCase.execute({ sessionId: SessionId.create().getValue(), playerId: PlayerId.create().getValue() }),
    ).rejects.toThrow('not found');
  });

  it('emite PlayerReconnectedEvent', async () => {
    const sessionId = SessionId.create().getValue();
    const playerId = PlayerId.create().getValue();
    await joinUseCase.execute({ sessionId, playerId, playerName: 'Alice' });
    await reconnectUseCase.execute({ sessionId, playerId });

    expect(bus.publish).toHaveBeenCalledWith(
      expect.objectContaining({ aggregateId: sessionId, playerId }),
    );
  });
});
