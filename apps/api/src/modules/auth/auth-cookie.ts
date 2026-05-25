import type { CookieOptions, Response } from 'express';

export const REFRESH_TOKEN_COOKIE_NAME = 'izticket_refresh_token';
export const REFRESH_TOKEN_COOKIE_PATH = '/api/v1/auth';

export interface RefreshTokenCookie {
    value: string;
    options: CookieOptions;
}

export function setRefreshTokenCookie(
    response: Response,
    cookie: RefreshTokenCookie,
) {
    response.cookie(REFRESH_TOKEN_COOKIE_NAME, cookie.value, cookie.options);
}

export function clearRefreshTokenCookie(
    response: Response,
    options: CookieOptions,
) {
    response.clearCookie(REFRESH_TOKEN_COOKIE_NAME, options);
}

export function getRefreshTokenCookie(
    cookieHeader: string | string[] | undefined,
) {
    const header = Array.isArray(cookieHeader)
        ? cookieHeader.join('; ')
        : cookieHeader;

    if (!header) {
        return null;
    }

    const cookiePrefix = `${REFRESH_TOKEN_COOKIE_NAME}=`;
    const cookieValue = header
        .split(';')
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith(cookiePrefix))
        ?.slice(cookiePrefix.length);

    if (!cookieValue) {
        return null;
    }

    try {
        return decodeURIComponent(cookieValue);
    } catch {
        return cookieValue;
    }
}
