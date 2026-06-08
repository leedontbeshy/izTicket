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

export type PublicEventListItem = {
    id: string;
    title: string;
    slug: string;
    status: 'PUBLISHED';
    venueName: string;
    city: string;
    startsAt: string;
    minPrice: number | null;
    thumbnailUrl: string | null;
};

export type PublicTicketType = {
    id: string;
    name: string;
    description: string | null;
    price: number;
    availableQuantity: number;
    saleStartsAt: string | null;
    saleEndsAt: string | null;
};

export type PublicEventDetail = {
    id: string;
    title: string;
    description: string;
    status: 'PUBLISHED';
    thumbnailUrl: string | null;
    startsAt: string;
    endsAt: string;
    venue: {
        name: string;
        address: string;
        city: string;
        district: string | null;
        mapUrl: string | null;
    };
    ticketTypes: PublicTicketType[];
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

export function getOrganizerEvent(eventId: string) {
    return apiGet<OrganizerEvent>(`/organizer/events/${eventId}`);
}

export function listPublicEvents(params: {
    page?: number;
    limit?: number;
    q?: string;
    city?: string;
    category?: string;
    from?: string;
    to?: string;
} = {}) {
    const search = new URLSearchParams();
    search.set('page', String(params.page ?? 1));
    search.set('limit', String(params.limit ?? 20));
    if (params.q?.trim()) search.set('q', params.q.trim());
    if (params.city?.trim()) search.set('city', params.city.trim());
    if (params.category?.trim()) search.set('category', params.category.trim());
    if (params.from) search.set('from', params.from);
    if (params.to) search.set('to', params.to);

    return apiGet<PageResponse<PublicEventListItem>>(
        `/events?${search.toString()}`,
    );
}

export function getPublicEvent(eventId: string) {
    return apiGet<PublicEventDetail>(`/events/${eventId}`);
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
