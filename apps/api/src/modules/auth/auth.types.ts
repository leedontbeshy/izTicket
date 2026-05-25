import type { UserRole } from '../../generated/prisma/enums';
import type { PublicUser } from '../user/user.service';
import type { RefreshTokenCookie } from './auth-cookie';

export interface AuthTokenPayload {
    sub: string;
    email: string;
    role: UserRole;
}

export interface LoginResponse {
    accessToken: string;
    user: PublicUser;
}

export interface AuthSessionResponse extends LoginResponse {
    refreshTokenCookie: RefreshTokenCookie;
}
