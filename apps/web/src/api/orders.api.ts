import { apiGet, apiPost } from './client';
import type { PageResponse } from './events.api';

export type OrderStatus =
    | 'PENDING_PAYMENT'
    | 'PAID'
    | 'CANCELLED'
    | 'EXPIRED'
    | 'PAYMENT_REVIEW';

export type OrderItem = {
    id: string;
    ticketTypeId: string;
    quantity: number;
    unitPriceVnd: number;
    subtotalVnd: number;
    unitPrice?: number;
    subtotal?: number;
};

export type Order = {
    id: string;
    eventId: string;
    customerId: string;
    reservationId: string;
    status: OrderStatus;
    totalAmountVnd: number;
    totalAmount?: number;
    expiresAt: string;
    paidAt: string | null;
    cancelledAt: string | null;
    createdAt: string;
    items: OrderItem[];
};

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

export type OrdersPageResponse = PageResponse<Order> | {
    data: Order[];
    meta: {
        page: number;
        limit: number;
        totalItems: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
};

type OrganizerOrdersResponse =
    | PageResponse<OrganizerOrder>
    | {
          data: OrganizerOrder[];
          meta: {
              page: number;
              limit: number;
              totalItems: number;
          };
      };

export async function listEventOrders(eventId: string, page = 1, limit = 20) {
    const response = await apiGet<OrganizerOrdersResponse>(
        `/organizer/events/${eventId}/orders?page=${page}&limit=${limit}`,
    );

    if ('items' in response) {
        return response;
    }

    return {
        items: response.data,
        page: response.meta.page,
        limit: response.meta.limit,
        total: response.meta.totalItems,
    };
}

export function createOrder(reservationId: string) {
    return apiPost<Order>('/orders', { reservationId });
}

export function getOrder(orderId: string) {
    return apiGet<Order>(`/orders/${orderId}`);
}

export function listMyOrders(page = 1, limit = 20) {
    return apiGet<OrdersPageResponse>(`/orders/my?page=${page}&limit=${limit}`);
}
