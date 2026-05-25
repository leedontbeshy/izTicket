import type { ExecutionContext } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import { jest } from '@jest/globals';
import { UserRole, UserStatus } from '../../generated/prisma/enums';
import type { UserService } from '../../modules/user/user.service';
import { AppException } from '../errors/app.exception';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
    let jwtService: ReturnType<typeof createJwtServiceMock>;
    let userService: ReturnType<typeof createUserServiceMock>;
    let guard: JwtAuthGuard;

    beforeEach(() => {
        jwtService = createJwtServiceMock();
        userService = createUserServiceMock();
        guard = new JwtAuthGuard(
            jwtService as unknown as JwtService,
            userService as unknown as UserService,
        );
    });

    it('rejects requests without a bearer token', async () => {
        await expect(guard.canActivate(createContext())).rejects.toThrow(
            AppException,
        );
    });

    it('rejects invalid tokens', async () => {
        jwtService.verifyAsync.mockRejectedValue(new Error('bad token'));

        await expect(
            guard.canActivate(
                createContext({
                    headers: { authorization: 'Bearer invalid-token' },
                }),
            ),
        ).rejects.toThrow(AppException);
    });

    it('rejects a disabled user even when the token is valid', async () => {
        jwtService.verifyAsync.mockResolvedValue({
            sub: 'user-1',
            email: 'customer@example.com',
            role: UserRole.CUSTOMER,
        });
        userService.findAuthUserById.mockResolvedValue({
            id: 'user-1',
            name: 'Customer',
            email: 'customer@example.com',
            role: UserRole.CUSTOMER,
            status: UserStatus.DISABLED,
            passwordHash: 'hashed-password',
        });

        await expect(
            guard.canActivate(
                createContext({
                    headers: { authorization: 'Bearer valid-token' },
                }),
            ),
        ).rejects.toThrow(AppException);
    });

    it('attaches the authenticated user to the request', async () => {
        const request = {
            headers: { authorization: 'Bearer valid-token' },
        };
        jwtService.verifyAsync.mockResolvedValue({
            sub: 'user-1',
            email: 'customer@example.com',
            role: UserRole.CUSTOMER,
        });
        userService.findAuthUserById.mockResolvedValue({
            id: 'user-1',
            name: 'Customer',
            email: 'customer@example.com',
            role: UserRole.CUSTOMER,
            status: UserStatus.ACTIVE,
            passwordHash: 'hashed-password',
        });

        await expect(guard.canActivate(createContext(request))).resolves.toBe(
            true,
        );
        expect(request).toHaveProperty('user', {
            id: 'user-1',
            email: 'customer@example.com',
            role: UserRole.CUSTOMER,
        });
    });
});

function createContext(request: Record<string, unknown> = {}) {
    return {
        switchToHttp: () => ({
            getRequest: () => request,
        }),
    } as unknown as ExecutionContext;
}

function createJwtServiceMock() {
    return {
        verifyAsync: jest.fn<() => Promise<unknown>>(),
    };
}

function createUserServiceMock() {
    return {
        findAuthUserById: jest.fn<() => Promise<unknown>>(),
    };
}
