import { jest } from '@jest/globals';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRole } from '../../generated/prisma/enums';

describe('AuthController', () => {
    let controller: AuthController;
    let authService: ReturnType<typeof createAuthServiceMock>;

    beforeEach(() => {
        authService = createAuthServiceMock();

        controller = new AuthController(authService as unknown as AuthService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('delegates registration to AuthService', async () => {
        authService.register.mockResolvedValue({
            id: 'user-1',
            name: 'Customer',
            email: 'customer@example.com',
            role: UserRole.CUSTOMER,
        });

        await expect(
            controller.register({
                name: 'Customer',
                email: 'customer@example.com',
                password: 'Password123',
                role: UserRole.CUSTOMER,
            }),
        ).resolves.toEqual({
            id: 'user-1',
            name: 'Customer',
            email: 'customer@example.com',
            role: UserRole.CUSTOMER,
        });
    });
});

function createAuthServiceMock() {
    return {
        register: jest.fn<() => Promise<unknown>>(),
        login: jest.fn<() => Promise<unknown>>(),
        getMe: jest.fn<() => Promise<unknown>>(),
    };
}
