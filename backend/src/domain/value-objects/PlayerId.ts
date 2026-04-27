import { randomUUID } from 'crypto';

export class PlayerId {
  private constructor(private readonly value: string) {}

  static create(): PlayerId {
    return new PlayerId(randomUUID());
  }

  static from(id: string): PlayerId {
    if (!id || id.trim().length === 0) {
      throw new Error('PlayerId cannot be empty');
    }
    return new PlayerId(id);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: PlayerId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
