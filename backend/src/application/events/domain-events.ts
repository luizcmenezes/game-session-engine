import { DomainEvent } from '../../domain/ports/IMessageBus';

export class PlayerJoinedEvent implements DomainEvent {
  readonly occurredAt = new Date();
  constructor(
    public readonly aggregateId: string,
    public readonly playerId: string,
  ) {}
}

export class GameStartedEvent implements DomainEvent {
  readonly occurredAt = new Date();
  constructor(public readonly aggregateId: string) {}
}

export class MoveAppliedEvent implements DomainEvent {
  readonly occurredAt = new Date();
  constructor(
    public readonly aggregateId: string,
    public readonly playerId: string,
    public readonly data: unknown,
  ) {}
}

export class PlayerLeftEvent implements DomainEvent {
  readonly occurredAt = new Date();
  constructor(
    public readonly aggregateId: string,
    public readonly playerId: string,
  ) {}
}

export class PlayerReconnectedEvent implements DomainEvent {
  readonly occurredAt = new Date();
  constructor(
    public readonly aggregateId: string,
    public readonly playerId: string,
  ) {}
}
