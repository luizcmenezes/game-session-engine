import { Injectable } from '@nestjs/common';
import {
  GAME_RULES_REGISTRY,
  IGameRules,
  IGameRulesRegistry,
} from '../../domain/ports/IGameRules';

@Injectable()
export class GameRulesRegistry implements IGameRulesRegistry {
  private readonly registry = new Map<string, IGameRules<unknown, unknown>>();

  register(gameType: string, rules: IGameRules<unknown, unknown>): void {
    this.registry.set(gameType, rules);
  }

  resolve(gameType: string): IGameRules<unknown, unknown> {
    const rules = this.registry.get(gameType);
    if (!rules) {
      throw new Error(`No game rules registered for gameType: "${gameType}"`);
    }
    return rules;
  }
}

export { GAME_RULES_REGISTRY };
