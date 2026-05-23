import { Injectable } from '@nestjs/common';
import { DomainEventBus } from './domain-event-bus';
import type { DomainEvent, DomainEventHandler } from './domain-event';

@Injectable()
export class InMemoryDomainEventBus extends DomainEventBus {
    private readonly handlers = new Map<string, Set<DomainEventHandler>>();

    async publish<TEvent extends DomainEvent>(event: TEvent): Promise<void> {
        const handlers = [...(this.handlers.get(event.name) ?? [])];

        for (const handler of handlers) {
            await handler(event);
        }
    }

    async publishAll(events: readonly DomainEvent[]): Promise<void> {
        for (const event of events) {
            await this.publish(event);
        }
    }

    subscribe<TEvent extends DomainEvent>(
        eventName: TEvent['name'],
        handler: DomainEventHandler<TEvent>,
    ): () => void {
        const handlers = this.handlers.get(eventName) ?? new Set();
        handlers.add(handler as DomainEventHandler);
        this.handlers.set(eventName, handlers);

        return () => {
            handlers.delete(handler as DomainEventHandler);

            if (handlers.size === 0) {
                this.handlers.delete(eventName);
            }
        };
    }
}
