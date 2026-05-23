import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../generated/prisma/enums';
import { AppException } from '../errors/app.exception';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
    it('allows requests when no role metadata is present', () => {
        const reflector = {
            getAllAndOverride: () => undefined,
        } as unknown as Reflector;
        const guard = new RolesGuard(reflector);

        expect(guard.canActivate(createContext())).toBe(true);
    });

    it('allows users with one of the required roles', () => {
        const reflector = {
            getAllAndOverride: () => [UserRole.ADMIN],
        } as unknown as Reflector;
        const guard = new RolesGuard(reflector);

        expect(
            guard.canActivate(
                createContext({
                    user: {
                        id: 'user-1',
                        email: 'admin@izticket.local',
                        role: UserRole.ADMIN,
                    },
                }),
            ),
        ).toBe(true);
    });

    it('rejects users without a required role', () => {
        const reflector = {
            getAllAndOverride: () => [UserRole.ADMIN],
        } as unknown as Reflector;
        const guard = new RolesGuard(reflector);

        expect(() =>
            guard.canActivate(
                createContext({
                    user: {
                        id: 'user-1',
                        email: 'customer@izticket.local',
                        role: UserRole.CUSTOMER,
                    },
                }),
            ),
        ).toThrow(AppException);
    });
});

function createContext(request: Record<string, unknown> = {}) {
    return {
        getHandler: () => testHandler,
        getClass: () => class TestController {},
        switchToHttp: () => ({
            getRequest: () => request,
        }),
    } as unknown as ExecutionContext;
}

function testHandler() {
    return undefined;
}
