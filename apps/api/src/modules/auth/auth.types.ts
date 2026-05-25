import type { UserRole } from '../../generated/prisma/enums';
import type { PublicUser } from '../users/users.service';

export interface AuthTokenPayload {
    sub: string;
    email: string;
    role: UserRole;
}

export interface LoginResponse {
    accessToken: string;
    user: PublicUser;
}
