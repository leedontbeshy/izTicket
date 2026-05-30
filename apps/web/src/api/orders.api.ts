import { apiGet } from './client';
import type { PageResponse } from './events.api';

export type OrderStatus =
    | 'PENDING_PAYMENT'
    | 'PAID'
    | 'CANCELLED'
    | 'EXPIRED';

export type OrganizerOrder = {
    id: string;
    status: OrderStatus;
    totalAmountVnd: number;
    expiresAt: string | null;
    paidAt: string | null;
    cancelledAt: string | null;
    createdAt: string;
    customer: { id: string; name: string; email: string };
    items: Array<{
        id: string;
        ticketTypeId: string;
        quantity: number;
        unitPriceVnd: number;
        subtotalVnd: number;
    }>;
};

export function listEventOrders(eventId: string, page = 1, limit = 20) {
    return apiGet<PageResponse<OrganizerOrder>>(
        `/organizer/events/${eventId}/orders?page=${page}&limit=${limit}`,
    );
}
