import type { DomainEvent } from '../../../common/events/domain-event';

export interface EventSubmittedPayload {
    eventId: string;
    organizerId: string;
}

export interface EventReviewedPayload {
    eventId: string;
    reviewerId: string;
    reason?: string;
}

export type EventSubmitted = DomainEvent<EventSubmittedPayload> & {
    name: 'EventSubmitted';
};

export type EventApproved = DomainEvent<EventReviewedPayload> & {
    name: 'EventApproved';
};

export type EventRejected = DomainEvent<EventReviewedPayload> & {
    name: 'EventRejected';
};

export function eventSubmitted(payload: EventSubmittedPayload): EventSubmitted {
    return {
        name: 'EventSubmitted',
        occurredAt: new Date(),
        payload,
    };
}

export function eventApproved(payload: EventReviewedPayload): EventApproved {
    return {
        name: 'EventApproved',
        occurredAt: new Date(),
        payload,
    };
}

export function eventRejected(payload: EventReviewedPayload): EventRejected {
    return {
        name: 'EventRejected',
        occurredAt: new Date(),
        payload,
    };
}
