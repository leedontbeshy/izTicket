export interface DomainEvent<TPayload = unknown> {
    name: string;
    occurredAt: Date;
    payload: TPayload;
}

export type DomainEventHandler<TEvent extends DomainEvent = DomainEvent> = (
    event: TEvent,
) => void | Promise<void>;
