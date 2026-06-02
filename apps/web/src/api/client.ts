import {
    clearAuthSession,
    saveAuthSession,
    type StoredAuthUser,
} from '../authSession';
import { clearCheckoutSession } from '../checkoutSession';

const API_BASE_URL =
    (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ??
    'http://localhost:3000/api/v1';

const ACCESS_TOKEN_KEY = 'izticket_access_token';

type AuthResponse = {
    accessToken: string;
    user: StoredAuthUser;
};

function authHeaders(): Record<string, string> {
    const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function readApiError(response: Response): Promise<string> {
    try {
        const payload: unknown = await response.json();
        const msg = extractMessage(payload);
        if (msg) return msg;
    } catch {
        // ignore parse error
    }
    return `Yêu cầu thất bại (${response.status}).`;
}

function extractMessage(payload: unknown): string {
    if (!isRecord(payload)) return '';

    const { details, message } = payload;

    if (Array.isArray(details)) {
        const first = details
            .filter(
                (d): d is { field: string; messages: string[] } =>
                    isRecord(d) && Array.isArray(d.messages),
            )
            .flatMap((d) => d.messages as string[])
            .at(0);
        if (first) return first;
    }

    if (typeof message === 'string') return message;
    if (Array.isArray(message)) {
        return message.filter((m): m is string => typeof m === 'string').join(' ');
    }

    return '';
}

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null;
}

export async function apiGet<T>(path: string): Promise<T> {
    const res = await apiFetch(path, {
        headers: authHeaders(),
    });
    return (await res.json()) as T;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
    const res = await apiFetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return (await res.json()) as T;
}

export async function apiPostVoid(path: string, body?: unknown): Promise<void> {
    await apiFetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
    const res = await apiFetch(path, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body),
    });
    return (await res.json()) as T;
}

async function apiFetch(path: string, init: RequestInit = {}, retry = true) {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        credentials: 'include',
    });

    if (res.status === 401 && retry && path !== '/auth/refresh') {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            return apiFetch(
                path,
                {
                    ...init,
                    headers: {
                        ...(init.headers as Record<string, string> | undefined),
                        ...authHeaders(),
                    },
                },
                false,
            );
        }

        clearExpiredSession();
    }

    if (!res.ok) throw new Error(await readApiError(res));
    return res;
}

async function refreshAccessToken() {
    try {
        const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
        });
        if (!res.ok) return false;

        const payload = (await res.json()) as AuthResponse;
        saveAuthSession(payload.accessToken, payload.user);
        return true;
    } catch {
        return false;
    }
}

function clearExpiredSession() {
    clearAuthSession();
    clearCheckoutSession();

    if (window.location.pathname !== '/auth/login') {
        const next = `${window.location.pathname}${window.location.search}`;
        window.location.assign(
            `/auth/login?next=${encodeURIComponent(next)}`,
        );
    }
}
