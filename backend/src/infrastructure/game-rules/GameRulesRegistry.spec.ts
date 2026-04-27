import { IGameRules } from '../../domain/ports/IGameRules';
import { GameRulesRegistry } from './GameRulesRegistry';

const makeStubRules = (): IGameRules<unknown, unknown> => ({
  getInitialState: () => ({}),
  applyMove: (state) => state,
  isGameOver: () => false,
  getValidMoves: () => [],
  getWinner: () => null,
});

describe('GameRulesRegistry', () => {
  let registry: GameRulesRegistry;

  beforeEach(() => {
    registry = new GameRulesRegistry();
  });

  it('registra e resolve um gameType', () => {
    const rules = makeStubRules();
    registry.register('snake', rules);
    expect(registry.resolve('snake')).toBe(rules);
  });

  it('lança erro para gameType não registrado', () => {
    expect(() => registry.resolve('unknown-game')).toThrow(
      'No game rules registered for gameType: "unknown-game"',
    );
  });

  it('suporta múltiplos gameTypes independentes', () => {
    const snakeRules = makeStubRules();
    const warRules = makeStubRules();
    registry.register('snake', snakeRules);
    registry.register('war-light', warRules);

    expect(registry.resolve('snake')).toBe(snakeRules);
    expect(registry.resolve('war-light')).toBe(warRules);
  });

  it('substituição: registrar mesmo gameType sobrescreve', () => {
    const v1 = makeStubRules();
    const v2 = makeStubRules();
    registry.register('snake', v1);
    registry.register('snake', v2);
    expect(registry.resolve('snake')).toBe(v2);
  });
});
