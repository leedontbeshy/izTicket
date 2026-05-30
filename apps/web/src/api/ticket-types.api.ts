import { apiGet, apiPatch, apiPost } from './client';

export type TicketType = {
    id: string;
    name: string;
    description?: string | null;
    price: number;
    totalQuantity: number;
    availableQuantity: number;
    soldQuantity: number;
    maxPerOrder?: number | null;
    saleStartsAt: string;
    saleEndsAt: string;
    createdAt: string;
    updatedAt: string;
};

export type CreateTicketTypePayload = {
    name: string;
    description?: string;
    price: number;
    totalQuantity: number;
    maxPerOrder?: number;
    saleStartsAt: string;
    saleEndsAt: string;
};

export type UpdateTicketTypePayload = Partial<CreateTicketTypePayload>;

export function listTicketTypes(eventId: string) {
    return apiGet<{ items: TicketType[] }>(
        `/organizer/events/${eventId}/ticket-types`,
    );
}

export function createTicketType(
    eventId: string,
    payload: CreateTicketTypePayload,
) {
    return apiPost<TicketType>(
        `/organizer/events/${eventId}/ticket-types`,
        payload,
    );
}

export function updateTicketType(
    ticketTypeId: string,
    payload: UpdateTicketTypePayload,
) {
    return apiPatch<TicketType>(
        `/organizer/ticket-types/${ticketTypeId}`,
        payload,
    );
}
