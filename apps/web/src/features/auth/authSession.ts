export type StoredUserRole = 'CUSTOMER' | 'ORGANIZER' | 'ADMIN';

export type StoredAuthUser = {
    id: string;
    name: string;
    email: string;
    role: StoredUserRole;
};

const AccessTokenStorageKey = 'izticket_access_token';
const UserStorageKey = 'izticket_user';

export function saveAuthSession(accessToken: string, user: StoredAuthUser) {
    sessionStorage.setItem(AccessTokenStorageKey, accessToken);
    sessionStorage.setItem(UserStorageKey, JSON.stringify(user));
}

export function clearAuthSession() {
    sessionStorage.removeItem(AccessTokenStorageKey);
    sessionStorage.removeItem(UserStorageKey);
}

export function getStoredAuthUser(): StoredAuthUser | null {
    const rawUser = sessionStorage.getItem(UserStorageKey);

    if (!rawUser) {
        return null;
    }

    try {
        const user: unknown = JSON.parse(rawUser);

        if (isStoredAuthUser(user)) {
            return user;
        }
    } catch {
        sessionStorage.removeItem(UserStorageKey);
    }

    return null;
}

export function getRoleLabel(role: StoredUserRole) {
    switch (role) {
        case 'CUSTOMER':
            return 'Khách hàng';
        case 'ORGANIZER':
            return 'Tổ chức';
        case 'ADMIN':
            return 'Quản trị';
    }
}

function isStoredAuthUser(value: unknown): value is StoredAuthUser {
    if (!isRecord(value)) {
        return false;
    }

    return (
        typeof value.id === 'string' &&
        typeof value.name === 'string' &&
        typeof value.email === 'string' &&
        isStoredUserRole(value.role)
    );
}

function isStoredUserRole(value: unknown): value is StoredUserRole {
    return value === 'CUSTOMER' || value === 'ORGANIZER' || value === 'ADMIN';
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}
