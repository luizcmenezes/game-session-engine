export interface IGameRules<TState, TMove> {
  getInitialState(playerIds: string[]): TState;
  applyMove(state: TState, move: TMove, playerId: string): TState;
  isGameOver(state: TState): boolean;
  getValidMoves(state: TState, playerId: string): TMove[];
  getWinner(state: TState): string | null;
}

export const GAME_RULES_REGISTRY = Symbol('IGameRulesRegistry');

export interface IGameRulesRegistry {
  resolve(gameType: string): IGameRules<unknown, unknown>;
}
