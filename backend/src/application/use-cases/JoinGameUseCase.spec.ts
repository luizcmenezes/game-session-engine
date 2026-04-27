import { GameSession, SessionStatus } from '../../domain/aggregates/GameSession';
import { InMemoryGameSessionRepository } from '../../infrastructure/persistence/InMemoryGameSessionRepository';
import { SessionId } from '../../domain/value-objects/SessionId';
import { JoinGameUseCase } from './JoinGameUseCase';
import { PlayerId } from '../../domain/value-objects/PlayerId';

const makeBus = () => ({ publish: jest.fn().mockResolvedValue(undefined) });

describe('JoinGameUseCase', () => {
  let repo: InMemoryGameSessionRepository;
  let useCase: JoinGameUseCase;
  let bus: ReturnType<typeof makeBus>;

  beforeEach(() => {
    repo = new InMemoryGameSessionRepository();
    bus = makeBus();
    useCase = new JoinGameUseCase(repo, bus);
  });

  it('cria nova sessão ao primeiro join', async () => {
    const sessionId = SessionId.create().getValue();
    const result = await useCase.execute({
      sessionId,
      playerId: PlayerId.create().getValue(),
      playerName: 'Alice',
    });

    expect(result.success).toBe(true);
    expect(result.state.players).toHaveLength(1);
    expect(result.state.status).toBe(SessionStatus.WAITING);
  });

  it('adiciona jogador a sessão existente', async () => {
    const sessionId = SessionId.create().getValue();
    await useCase.execute({ sessionId, playerId: PlayerId.create().getValue(), playerName: 'Alice' });
    const result = await useCase.execute({ sessionId, playerId: PlayerId.create().getValue(), playerName: 'Bob' });

    expect(result.state.players).toHaveLength(2);
  });

  it('rejeita 5º jogador', async () => {
    const sessionId = SessionId.create().getValue();
    for (let i = 0; i < 4; i++) {
      await useCase.execute({ sessionId, playerId: PlayerId.create().getValue(), playerName: `P${i}` });
    }

    await expect(
      useCase.execute({ sessionId, playerId: PlayerId.create().getValue(), playerName: 'Extra' }),
    ).rejects.toThrow('Session is full');
  });

  it('emite PlayerJoinedEvent', async () => {
    const sessionId = SessionId.create().getValue();
    const playerId = PlayerId.create().getValue();
    await useCase.execute({ sessionId, playerId, playerName: 'Alice' });

    expect(bus.publish).toHaveBeenCalledWith(
      expect.objectContaining({ aggregateId: sessionId, playerId }),
    );
  });
});
