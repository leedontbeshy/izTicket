import { apiGet, apiPost } from './client';

export type ReservationStatus = 'ACTIVE' | 'CONFIRMED' | 'EXPIRED' | 'CANCELLED';

export type ReservationItem = {
    id: string;
    ticketTypeId: string;
    quantity: number;
    unitPriceVnd: number;
    subtotalVnd: number;
    unitPrice?: number;
    subtotal?: number;
};

export type Reservation = {
    id: string;
    eventId: string;
    customerId: string;
    status: ReservationStatus;
    expiresAt: string;
    createdAt: string;
    items: ReservationItem[];
    totalAmount?: number;
};

export type CreateReservationPayload = {
    eventId: string;
    items: Array<{
        ticketTypeId: string;
        quantity: number;
    }>;
};

export function createReservation(payload: CreateReservationPayload) {
    return apiPost<Reservation>('/reservations', payload);
}

export function getReservation(reservationId: string) {
    return apiGet<Reservation>(`/reservations/${reservationId}`);
}

export function cancelReservation(reservationId: string) {
    return apiPost<Reservation>(`/reservations/${reservationId}/cancel`);
}
