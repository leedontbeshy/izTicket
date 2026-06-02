import type { SepayPayment } from './api/payments.api';

const CheckoutSessionKey = 'izticket_checkout_session';

export type CheckoutSession = {
    eventId: string;
    reservationId: string;
    expiresAt: string;
    orderId?: string;
    paymentId?: string;
    payment?: SepayPayment;
    updatedAt: string;
};

export function getCheckoutSession(): CheckoutSession | null {
    const rawSession = localStorage.getItem(CheckoutSessionKey);

    if (!rawSession) return null;

    try {
        const session: unknown = JSON.parse(rawSession);
        if (isCheckoutSession(session)) return session;
    } catch {
        localStorage.removeItem(CheckoutSessionKey);
    }

    return null;
}

export function getActiveCheckoutSession(eventId?: string) {
    const session = getCheckoutSession();

    if (!session) return null;
    if (eventId && session.eventId !== eventId) return null;
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
        clearCheckoutSession();
        return null;
    }

    return session;
}

export function saveCheckoutSession(
    session: Omit<CheckoutSession, 'updatedAt'>,
) {
    localStorage.setItem(
        CheckoutSessionKey,
        JSON.stringify({ ...session, updatedAt: new Date().toISOString() }),
    );
}

export function patchCheckoutSession(
    patch: Partial<Omit<CheckoutSession, 'updatedAt'>>,
) {
    const current = getCheckoutSession();
    if (!current) return;

    saveCheckoutSession({ ...current, ...patch });
}

export function clearCheckoutSession() {
    localStorage.removeItem(CheckoutSessionKey);
}

function isCheckoutSession(value: unknown): value is CheckoutSession {
    if (!isRecord(value)) return false;

    return (
        typeof value.eventId === 'string' &&
        typeof value.reservationId === 'string' &&
        typeof value.expiresAt === 'string' &&
        typeof value.updatedAt === 'string'
    );
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}
