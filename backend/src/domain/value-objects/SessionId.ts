import { randomUUID } from 'crypto';

export class SessionId {
  private constructor(private readonly value: string) {}

  static create(): SessionId {
    return new SessionId(randomUUID());
  }

  static from(id: string): SessionId {
    if (!id || id.trim().length === 0) {
      throw new Error('SessionId cannot be empty');
    }
    return new SessionId(id);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: SessionId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
