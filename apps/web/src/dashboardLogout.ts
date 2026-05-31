import { apiPostVoid } from './api/client';

export async function logout() {
    try {
        await apiPostVoid('/auth/logout');
    } finally {
        sessionStorage.clear();
        window.location.assign('/');
    }
}
