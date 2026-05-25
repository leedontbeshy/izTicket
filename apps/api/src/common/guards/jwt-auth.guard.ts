import {
    CanActivate,
    ExecutionContext,
    Injectable,
    type RawBodyRequest,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { UserRole, UserStatus } from '../../generated/prisma/enums';
import { UserService } from '../../modules/user/user.service';
import type { AuthTokenPayload } from '../../modules/auth/auth.types';
import type { AuthenticatedRequest } from '../decorators/current-user.decorator';
import { AppException } from '../errors/app.exception';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly userService: UserService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context
            .switchToHttp()
            .getRequest<RawBodyRequest<Request> & AuthenticatedRequest>();
        const token = extractBearerToken(request.headers?.authorization);

        if (!token) {
            throw AppException.unauthorized('Bearer token is required.');
        }

        const payload = await this.verifyToken(token);
        const user = await this.userService.findAuthUserById(payload.sub);

        if (!user || user.status === UserStatus.DISABLED) {
            throw AppException.unauthorized('Invalid or expired token.');
        }

        request.user = {
            id: user.id,
            email: user.email,
            role: user.role,
        };

        return true;
    }

    private async verifyToken(token: string): Promise<AuthTokenPayload> {
        try {
            const payload =
                await this.jwtService.verifyAsync<AuthTokenPayload>(token);

            if (!isAuthTokenPayload(payload)) {
                throw AppException.unauthorized('Invalid or expired token.');
            }

            return payload;
        } catch (error: unknown) {
            if (error instanceof AppException) {
                throw error;
            }

            throw AppException.unauthorized('Invalid or expired token.');
        }
    }
}

function extractBearerToken(header: string | string[] | undefined) {
    if (typeof header !== 'string') {
        return null;
    }

    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return null;
    }

    return token;
}

function isAuthTokenPayload(value: unknown): value is AuthTokenPayload {
    return (
        typeof value === 'object' &&
        value !== null &&
        'sub' in value &&
        typeof value.sub === 'string' &&
        'email' in value &&
        typeof value.email === 'string' &&
        'role' in value &&
        isUserRole(value.role)
    );
}

function isUserRole(value: unknown): value is UserRole {
    return Object.values(UserRole).includes(value as UserRole);
}
