import { apiGet, apiPost } from './client';
import type { PageResponse } from './events.api';

export type PendingEvent = {
    id: string;
    title: string;
    category: string;
    status: string;
    startsAt: string;
    submittedAt: string;
    organizer: { id: string; name: string; email: string };
    venue: { name: string; city: string };
};

export type AdminEventDetail = {
    id: string;
    title: string;
    slug: string;
    description: string;
    category: string;
    status: string;
    thumbnailUrl?: string | null;
    startsAt: string;
    endsAt: string;
    submittedAt: string | null;
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;
    organizer: { id: string; name: string; email: string };
    venue: {
        name: string;
        address: string;
        city: string;
        district?: string | null;
        mapUrl?: string | null;
    };
    ticketTypes: Array<{
        id: string;
        name: string;
        description?: string | null;
        priceVnd: number;
        totalQuantity: number;
        availableQuantity: number;
        saleStartsAt: string;
        saleEndsAt: string;
    }>;
    reviews: Array<{
        id: string;
        decision: string;
        reason?: string | null;
        createdAt: string;
        reviewer: { id: string; name: string };
    }>;
};

export function listPendingEvents(page = 1, limit = 20) {
    return apiGet<PageResponse<PendingEvent>>(
        `/admin/events/pending?page=${page}&limit=${limit}`,
    );
}

export function getAdminEventDetail(eventId: string) {
    return apiGet<AdminEventDetail>(`/admin/events/${eventId}`);
}

export function approveEvent(eventId: string) {
    return apiPost<{ id: string; status: string }>(
        `/admin/events/${eventId}/approve`,
    );
}

export function rejectEvent(eventId: string, reason: string) {
    return apiPost<{ id: string; status: string }>(
        `/admin/events/${eventId}/reject`,
        { reason },
    );
}
