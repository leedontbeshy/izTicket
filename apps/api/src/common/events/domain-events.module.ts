import { Global, Module } from '@nestjs/common';
import { DomainEventBus } from './domain-event-bus';
import { InMemoryDomainEventBus } from './in-memory-domain-event-bus';

@Global()
@Module({
    providers: [
        {
            provide: DomainEventBus,
            useClass: InMemoryDomainEventBus,
        },
    ],
    exports: [DomainEventBus],
})
export class DomainEventsModule {}
