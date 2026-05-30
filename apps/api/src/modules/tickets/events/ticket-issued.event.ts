import type { DomainEvent } from '../../../common/events/domain-event';

export type TicketIssuedPayload = {
    ticketId: string;
    orderId: string;
    customerId: string;
    eventId: string;
};

export type TicketIssuedEvent = DomainEvent<TicketIssuedPayload> & {
    name: 'ticket.issued';
};

export function ticketIssued(payload: TicketIssuedPayload): TicketIssuedEvent {
    return {
        name: 'ticket.issued',
        occurredAt: new Date(),
        payload,
    };
}
