import { Injectable } from '@nestjs/common';
import { DomainEvent, IMessageBus } from '../../domain/ports/IMessageBus';

@Injectable()
export class NullMessageBus implements IMessageBus {
  async publish(_event: DomainEvent): Promise<void> {}
}
