import { apiGet, apiPatch, apiPost } from './client';

export type EventStatus =
    | 'DRAFT'
    | 'PENDING_REVIEW'
    | 'PUBLISHED'
    | 'REJECTED'
    | 'CANCELLED';

export type OrganizerEvent = {
    id: string;
    title: string;
    slug: string;
    description: string;
    category: string;
    status: EventStatus;
    thumbnailUrl: string | null;
    startsAt: string;
    endsAt: string;
    submittedAt: string | null;
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;
    venue: {
        name: string;
        address: string;
        city: string;
        district: string | null;
        mapUrl: string | null;
    };
};

export type PageResponse<T> = {
    items: T[];
    page: number;
    limit: number;
    total: number;
};

export type EventVenuePayload = {
    name: string;
    address: string;
    city: string;
    district?: string;
    mapUrl?: string;
};

export type CreateEventPayload = {
    title: string;
    description: string;
    category: string;
    thumbnailUrl?: string;
    startsAt: string;
    endsAt: string;
    venue: EventVenuePayload;
};

export function listOrganizerEvents(page = 1, limit = 20) {
    return apiGet<PageResponse<OrganizerEvent>>(
        `/organizer/events?page=${page}&limit=${limit}`,
    );
}

export function createEvent(payload: CreateEventPayload) {
    return apiPost<{ id: string; status: EventStatus }>(
        '/organizer/events',
        payload,
    );
}

export function updateEvent(
    eventId: string,
    payload: Partial<CreateEventPayload>,
) {
    return apiPatch<OrganizerEvent>(`/organizer/events/${eventId}`, payload);
}

export function submitEvent(eventId: string) {
    return apiPost<{ id: string; status: EventStatus }>(
        `/organizer/events/${eventId}/submit`,
    );
}
