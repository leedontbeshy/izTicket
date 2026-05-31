const API_BASE_URL =
    (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ??
    'http://localhost:3000/api/v1';

const ACCESS_TOKEN_KEY = 'izticket_access_token';

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
    const res = await fetch(`${API_BASE_URL}${path}`, {
        headers: authHeaders(),
        credentials: 'include',
    });
    if (!res.ok) throw new Error(await readApiError(res));
    return (await res.json()) as T;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        credentials: 'include',
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(await readApiError(res));
    return (await res.json()) as T;
}

export async function apiPostVoid(path: string, body?: unknown): Promise<void> {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        credentials: 'include',
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(await readApiError(res));
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        credentials: 'include',
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await readApiError(res));
    return (await res.json()) as T;
}
