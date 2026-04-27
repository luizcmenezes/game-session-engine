import { PlayerId } from '../value-objects/PlayerId';

export class Player {
  constructor(
    public readonly id: PlayerId,
    public readonly name: string,
    public score: number = 0,
  ) {
    if (!name || name.trim().length === 0) {
      throw new Error('Player name cannot be empty');
    }
  }
}
