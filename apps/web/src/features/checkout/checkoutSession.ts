import type { SepayPayment } from '../../api/payments.api';

const CheckoutSessionKey = 'izticket_checkout_sessions';
const LegacyCheckoutSessionKey = 'izticket_checkout_session';

export type CheckoutSession = {
    eventId: string;
    reservationId: string;
    expiresAt: string;
    orderId?: string;
    paymentId?: string;
    payment?: SepayPayment;
    updatedAt: string;
};

export function getCheckoutSessions(): CheckoutSession[] {
    const sessions = readCheckoutSessions();
    const activeSessions = sessions.filter(isSessionStillHeld);

    if (activeSessions.length !== sessions.length) {
        writeCheckoutSessions(activeSessions);
    }

    return activeSessions.sort(
        (first, second) =>
            new Date(second.updatedAt).getTime() -
            new Date(first.updatedAt).getTime(),
    );
}

export function getCheckoutSession(reservationId?: string): CheckoutSession | null {
    const sessions = getCheckoutSessions();

    if (reservationId) {
        return sessions.find((session) => session.reservationId === reservationId) ?? null;
    }

    return sessions[0] ?? null;
}

export function getActiveCheckoutSession(eventId?: string) {
    const sessions = getCheckoutSessions();

    if (eventId) {
        return sessions.find((session) => session.eventId === eventId) ?? null;
    }

    return sessions[0] ?? null;
}

export function saveCheckoutSession(
    session: Omit<CheckoutSession, 'updatedAt'>,
) {
    const nextSession = { ...session, updatedAt: new Date().toISOString() };
    const sessions = getCheckoutSessions().filter(
        (current) =>
            current.eventId !== session.eventId &&
            current.reservationId !== session.reservationId,
    );

    writeCheckoutSessions([nextSession, ...sessions]);
}

export function patchCheckoutSession(
    patch: Partial<Omit<CheckoutSession, 'updatedAt'>>,
    reservationId?: string,
) {
    const current = getCheckoutSession(reservationId);
    if (!current) return;

    saveCheckoutSession({ ...current, ...patch });
}

export function clearCheckoutSession(reservationId?: string) {
    if (!reservationId) {
        localStorage.removeItem(CheckoutSessionKey);
        localStorage.removeItem(LegacyCheckoutSessionKey);
        return;
    }

    writeCheckoutSessions(
        getCheckoutSessions().filter(
            (session) => session.reservationId !== reservationId,
        ),
    );
}

function readCheckoutSessions(): CheckoutSession[] {
    const rawSessions = localStorage.getItem(CheckoutSessionKey);

    if (rawSessions) {
        try {
            const sessions: unknown = JSON.parse(rawSessions);
            if (Array.isArray(sessions)) {
                return sessions.filter(isCheckoutSession);
            }
        } catch {
            localStorage.removeItem(CheckoutSessionKey);
        }
    }

    const legacySession = readLegacyCheckoutSession();
    if (!legacySession) return [];

    writeCheckoutSessions([legacySession]);
    localStorage.removeItem(LegacyCheckoutSessionKey);
    return [legacySession];
}

function readLegacyCheckoutSession() {
    const rawSession = localStorage.getItem(LegacyCheckoutSessionKey);
    if (!rawSession) return null;

    try {
        const session: unknown = JSON.parse(rawSession);
        if (isCheckoutSession(session)) return session;
    } catch {
        localStorage.removeItem(LegacyCheckoutSessionKey);
    }

    return null;
}

function writeCheckoutSessions(sessions: CheckoutSession[]) {
    localStorage.setItem(CheckoutSessionKey, JSON.stringify(sessions));
}

function isSessionStillHeld(session: CheckoutSession) {
    return new Date(session.expiresAt).getTime() > Date.now();
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
