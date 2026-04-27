export interface DomainEvent {
  occurredAt: Date;
  aggregateId: string;
}

export interface IMessageBus {
  publish(event: DomainEvent): Promise<void>;
}

export const MESSAGE_BUS = Symbol('IMessageBus');
