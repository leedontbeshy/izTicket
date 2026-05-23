import { InMemoryDomainEventBus } from './in-memory-domain-event-bus';
import type { DomainEvent } from './domain-event';

interface TestEventPayload {
    id: string;
}

describe('InMemoryDomainEventBus', () => {
    it('publishes events to subscribed handlers in order', async () => {
        const eventBus = new InMemoryDomainEventBus();
        const handledEvents: string[] = [];
        const event: DomainEvent<TestEventPayload> = {
            name: 'TestEvent',
            occurredAt: new Date('2026-05-23T00:00:00.000Z'),
            payload: {
                id: 'event-1',
            },
        };

        eventBus.subscribe<typeof event>(event.name, () => {
            handledEvents.push('first');
        });
        eventBus.subscribe<typeof event>(event.name, () => {
            handledEvents.push('second');
        });

        await eventBus.publish(event);

        expect(handledEvents).toEqual(['first', 'second']);
    });

    it('returns an unsubscribe function', async () => {
        const eventBus = new InMemoryDomainEventBus();
        let handledCount = 0;
        const event: DomainEvent = {
            name: 'TestEvent',
            occurredAt: new Date('2026-05-23T00:00:00.000Z'),
            payload: {},
        };

        const unsubscribe = eventBus.subscribe(event.name, () => {
            handledCount += 1;
        });
        unsubscribe();

        await eventBus.publish(event);

        expect(handledCount).toBe(0);
    });
});
