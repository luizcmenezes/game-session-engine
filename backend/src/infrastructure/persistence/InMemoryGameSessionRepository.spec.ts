import { GameSession } from '../../domain/aggregates/GameSession';
import { Player } from '../../domain/entities/Player';
import { PlayerId } from '../../domain/value-objects/PlayerId';
import { SessionId } from '../../domain/value-objects/SessionId';
import { InMemoryGameSessionRepository } from './InMemoryGameSessionRepository';

describe('InMemoryGameSessionRepository', () => {
  let repo: InMemoryGameSessionRepository;

  beforeEach(() => {
    repo = new InMemoryGameSessionRepository();
  });

  it('salva e recupera sessão', async () => {
    const session = GameSession.create();
    await repo.save(session, 0);

    const found = await repo.findById(session.id);
    expect(found).not.toBeNull();
    expect(found!.id.getValue()).toBe(session.id.getValue());
  });

  it('retorna null para ID inexistente', async () => {
    const result = await repo.findById(SessionId.create());
    expect(result).toBeNull();
  });

  it('lança erro em conflito de versão', async () => {
    const session = GameSession.create();
    await repo.save(session, 0);

    await expect(repo.save(session, 99)).rejects.toThrow('Version conflict');
  });

  it('deleta sessão', async () => {
    const session = GameSession.create();
    await repo.save(session, 0);
    await repo.delete(session.id);

    const found = await repo.findById(session.id);
    expect(found).toBeNull();
  });

  it('findAll retorna todas as sessões', async () => {
    const s1 = GameSession.create();
    const s2 = GameSession.create();
    await repo.save(s1, 0);
    await repo.save(s2, 0);

    const all = await repo.findAll();
    expect(all).toHaveLength(2);
  });

  it('deep clone — mutação não afeta o repositório', async () => {
    const session = GameSession.create();
    await repo.save(session, 0);

    const retrieved = await repo.findById(session.id);
    retrieved!.addPlayer(new Player(PlayerId.create(), 'Alice', 0));

    const reloaded = await repo.findById(session.id);
    expect(reloaded!.getPlayers()).toHaveLength(0);
  });

  it('suporta save concorrente sem corrupção de estado', async () => {
    const session = GameSession.create();
    await repo.save(session, 0);

    const [r1, r2] = await Promise.all([
      repo.findById(session.id),
      repo.findById(session.id),
    ]);

    r1!.addPlayer(new Player(PlayerId.create(), 'Alice', 0));
    r2!.addPlayer(new Player(PlayerId.create(), 'Bob', 0));

    await repo.save(r1!, 0);
    await expect(repo.save(r2!, 0)).rejects.toThrow('Version conflict');
  });
});
