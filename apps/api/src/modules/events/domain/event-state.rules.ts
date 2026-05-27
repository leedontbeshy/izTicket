export type EventWorkflowStatus =
    | 'DRAFT'
    | 'PENDING_REVIEW'
    | 'PUBLISHED'
    | 'REJECTED'
    | 'CANCELLED';

export function canEditEvent(status: EventWorkflowStatus) {
    return status === 'DRAFT' || status === 'REJECTED';
}

export function canSubmitEvent(status: EventWorkflowStatus) {
    return status === 'DRAFT' || status === 'REJECTED';
}

export function canReviewEvent(status: EventWorkflowStatus) {
    return status === 'PENDING_REVIEW';
}
