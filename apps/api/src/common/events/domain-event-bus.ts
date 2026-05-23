import type { DomainEvent, DomainEventHandler } from './domain-event';

export abstract class DomainEventBus {
    abstract publish<TEvent extends DomainEvent>(event: TEvent): Promise<void>;

    abstract publishAll(events: readonly DomainEvent[]): Promise<void>;

    abstract subscribe<TEvent extends DomainEvent>(
        eventName: TEvent['name'],
        handler: DomainEventHandler<TEvent>,
    ): () => void;
}
