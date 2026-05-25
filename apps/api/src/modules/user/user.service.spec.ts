import { jest } from '@jest/globals';
import { UserRole, UserStatus } from '../../generated/prisma/enums';
import { AppException } from '../../common/errors/app.exception';
import type { PrismaService } from '../../prisma/prisma.service';
import { UserService } from './user.service';

describe('UserService', () => {
    let prismaService: ReturnType<typeof createPrismaServiceMock>;
    let service: UserService;

    beforeEach(() => {
        prismaService = createPrismaServiceMock();
        service = new UserService(prismaService as unknown as PrismaService);
    });

    it('normalizes email when creating a user and hides password hashes', async () => {
        prismaService.user.findUnique.mockResolvedValue(null);
        prismaService.user.create.mockImplementation(({ data }) =>
            Promise.resolve({
                id: 'user-1',
                name: data.name,
                email: data.email,
                role: data.role,
                status: UserStatus.ACTIVE,
                passwordHash: data.passwordHash,
            }),
        );

        const user = await service.createUser({
            name: ' Customer ',
            email: 'CUSTOMER@Example.COM ',
            passwordHash: 'hashed-password',
            role: UserRole.CUSTOMER,
        });

        const createArgs = prismaService.user.create.mock.calls[0]?.[0];

        expect(createArgs?.data.email).toBe('customer@example.com');
        expect(createArgs?.data.name).toBe('Customer');
        expect(user).toEqual({
            id: 'user-1',
            name: 'Customer',
            email: 'customer@example.com',
            role: UserRole.CUSTOMER,
        });
        expect(user).not.toHaveProperty('passwordHash');
    });

    it('rejects duplicate email addresses', async () => {
        prismaService.user.findUnique.mockResolvedValue({ id: 'existing' });

        await expect(
            service.createUser({
                name: 'Customer',
                email: 'customer@example.com',
                passwordHash: 'hashed-password',
                role: UserRole.CUSTOMER,
            }),
        ).rejects.toThrow(AppException);
        expect(prismaService.user.create).not.toHaveBeenCalled();
    });
});

function createPrismaServiceMock() {
    return {
        user: {
            findUnique: jest.fn<() => Promise<unknown>>(),
            create: jest.fn<
                (args: { data: Record<string, unknown> }) => Promise<unknown>
            >(),
        },
    };
}
