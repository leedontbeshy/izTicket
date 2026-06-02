import { apiGet } from './client';

export type TicketStatus = 'ISSUED' | 'VOIDED';

export type CustomerTicket = {
    id: string;
    eventTitle: string;
    ticketTypeName: string;
    status: TicketStatus;
    issuedAt: string;
    qrPayload: string;
};

export type CustomerTicketsResponse = {
    items: CustomerTicket[];
};

export type TicketDetail = CustomerTicket & {
    orderId: string;
    eventId: string;
    ticketCode: string;
    ticketTypeDescription: string | null;
    voidedAt: string | null;
    eventStartsAt: string;
    eventEndsAt: string;
    venue: {
        name: string;
        address: string;
        city: string;
    };
};

export function listMyTickets() {
    return apiGet<CustomerTicketsResponse>('/tickets/my');
}

export function getTicket(ticketId: string) {
    return apiGet<TicketDetail>(`/tickets/${ticketId}`);
}
