import { Test, TestingModule } from '@nestjs/testing';
import { jest } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UserRole, UserStatus } from '../../generated/prisma/enums';
import { AppException } from '../../common/errors/app.exception';
import { PrismaService } from '../../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { PasswordHasher } from './password-hasher.service';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'node:crypto';

const refreshTokenCookieOptions = {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/v1/auth',
    sameSite: 'lax',
    secure: false,
};

describe('AuthService', () => {
    let service: AuthService;
    let userService: ReturnType<typeof createUserServiceMock>;
    let passwordHasher: ReturnType<typeof createPasswordHasherMock>;
    let jwtService: ReturnType<typeof createJwtServiceMock>;
    let prismaService: ReturnType<typeof createPrismaServiceMock>;
    let configService: ReturnType<typeof createConfigServiceMock>;

    beforeEach(async () => {
        userService = createUserServiceMock();
        passwordHasher = createPasswordHasherMock();
        jwtService = createJwtServiceMock();
        prismaService = createPrismaServiceMock();
        configService = createConfigServiceMock();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: UserService,
                    useValue: userService,
                },
                {
                    provide: PasswordHasher,
                    useValue: passwordHasher,
                },
                {
                    provide: JwtService,
                    useValue: jwtService,
                },
                {
                    provide: PrismaService,
                    useValue: prismaService,
                },
                {
                    provide: ConfigService,
                    useValue: configService,
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('registers customers and stores a hashed password', async () => {
        passwordHasher.hash.mockResolvedValue('hashed-password');
        userService.createUser.mockResolvedValue({
            id: 'user-1',
            name: 'Customer',
            email: 'customer@example.com',
            role: UserRole.CUSTOMER,
        });

        await expect(
            service.register({
                name: 'Customer',
                email: 'CUSTOMER@example.com',
                password: 'Password123',
                role: UserRole.CUSTOMER,
            }),
        ).resolves.toEqual({
            id: 'user-1',
            name: 'Customer',
            email: 'customer@example.com',
            role: UserRole.CUSTOMER,
        });
        expect(passwordHasher.hash).toHaveBeenCalledWith('Password123');
        expect(userService.createUser).toHaveBeenCalledWith({
            name: 'Customer',
            email: 'CUSTOMER@example.com',
            passwordHash: 'hashed-password',
            role: UserRole.CUSTOMER,
        });
    });

    it('rejects public admin registration', async () => {
        await expect(
            service.register({
                name: 'Admin',
                email: 'admin@example.com',
                password: 'Password123',
                role: UserRole.ADMIN,
            }),
        ).rejects.toThrow(AppException);
        expect(passwordHasher.hash).not.toHaveBeenCalled();
    });

    it('logs in an active user with a valid password', async () => {
        userService.findAuthUserByEmail.mockResolvedValue({
            id: 'user-1',
            name: 'Customer',
            email: 'customer@example.com',
            role: UserRole.CUSTOMER,
            status: UserStatus.ACTIVE,
            passwordHash: 'hashed-password',
        });
        passwordHasher.verify.mockResolvedValue(true);
        jwtService.signAsync.mockResolvedValue('access-token');
        prismaService.authSession.create.mockResolvedValue({});

        await expect(
            service.login({
                email: 'customer@example.com',
                password: 'Password123',
            }),
        ).resolves.toEqual({
            accessToken: 'access-token',
            user: {
                id: 'user-1',
                name: 'Customer',
                email: 'customer@example.com',
                role: UserRole.CUSTOMER,
            },
            refreshTokenCookie: {
                value: expect.any(String),
                options: refreshTokenCookieOptions,
            },
        });
        expect(jwtService.signAsync).toHaveBeenCalledWith({
            sub: 'user-1',
            email: 'customer@example.com',
            role: UserRole.CUSTOMER,
        });
        expect(prismaService.authSession.create).toHaveBeenCalledWith({
            data: {
                userId: 'user-1',
                tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
                expiresAt: expect.any(Date),
            },
        });
    });

    it('rejects login with a wrong password', async () => {
        userService.findAuthUserByEmail.mockResolvedValue({
            id: 'user-1',
            name: 'Customer',
            email: 'customer@example.com',
            role: UserRole.CUSTOMER,
            status: UserStatus.ACTIVE,
            passwordHash: 'hashed-password',
        });
        passwordHasher.verify.mockResolvedValue(false);

        await expect(
            service.login({
                email: 'customer@example.com',
                password: 'wrong-password',
            }),
        ).rejects.toThrow(AppException);
    });

    it('rejects a disabled user during login', async () => {
        userService.findAuthUserByEmail.mockResolvedValue({
            id: 'user-1',
            name: 'Customer',
            email: 'customer@example.com',
            role: UserRole.CUSTOMER,
            status: UserStatus.DISABLED,
            passwordHash: 'hashed-password',
        });

        await expect(
            service.login({
                email: 'customer@example.com',
                password: 'Password123',
            }),
        ).rejects.toThrow(AppException);
        expect(passwordHasher.verify).not.toHaveBeenCalled();
    });

    it('refreshes an active session and rotates the refresh token', async () => {
        prismaService.authSession.findUnique.mockResolvedValue({
            id: 'session-1',
            userId: 'user-1',
            expiresAt: new Date(Date.now() + 60_000),
            revokedAt: null,
            user: {
                id: 'user-1',
                name: 'Customer',
                email: 'customer@example.com',
                role: UserRole.CUSTOMER,
                status: UserStatus.ACTIVE,
            },
        });
        prismaService.authSession.updateMany.mockResolvedValue({ count: 1 });
        prismaService.authSession.create.mockResolvedValue({});
        jwtService.signAsync.mockResolvedValue('new-access-token');

        await expect(service.refresh('refresh-token')).resolves.toEqual({
            accessToken: 'new-access-token',
            user: {
                id: 'user-1',
                name: 'Customer',
                email: 'customer@example.com',
                role: UserRole.CUSTOMER,
            },
            refreshTokenCookie: {
                value: expect.any(String),
                options: refreshTokenCookieOptions,
            },
        });
        expect(prismaService.authSession.findUnique).toHaveBeenCalledWith({
            where: { tokenHash: hashTestRefreshToken('refresh-token') },
            select: expect.any(Object),
        });
        expect(prismaService.authSession.updateMany).toHaveBeenCalledWith({
            where: {
                id: 'session-1',
                revokedAt: null,
            },
            data: {
                revokedAt: expect.any(Date),
            },
        });
        expect(prismaService.authSession.create).toHaveBeenCalledWith({
            data: {
                userId: 'user-1',
                tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
                expiresAt: expect.any(Date),
            },
        });
    });

    it('rejects refresh without a token', async () => {
        await expect(service.refresh(null)).rejects.toThrow(AppException);
        expect(prismaService.authSession.findUnique).not.toHaveBeenCalled();
    });

    it('rejects unknown refresh tokens', async () => {
        prismaService.authSession.findUnique.mockResolvedValue(null);

        await expect(service.refresh('refresh-token')).rejects.toThrow(
            AppException,
        );
    });

    it('rejects expired refresh sessions', async () => {
        prismaService.authSession.findUnique.mockResolvedValue({
            id: 'session-1',
            userId: 'user-1',
            expiresAt: new Date(Date.now() - 60_000),
            revokedAt: null,
            user: {
                id: 'user-1',
                name: 'Customer',
                email: 'customer@example.com',
                role: UserRole.CUSTOMER,
                status: UserStatus.ACTIVE,
            },
        });

        await expect(service.refresh('refresh-token')).rejects.toThrow(
            AppException,
        );
    });

    it('rejects revoked refresh sessions', async () => {
        prismaService.authSession.findUnique.mockResolvedValue({
            id: 'session-1',
            userId: 'user-1',
            expiresAt: new Date(Date.now() + 60_000),
            revokedAt: new Date(),
            user: {
                id: 'user-1',
                name: 'Customer',
                email: 'customer@example.com',
                role: UserRole.CUSTOMER,
                status: UserStatus.ACTIVE,
            },
        });

        await expect(service.refresh('refresh-token')).rejects.toThrow(
            AppException,
        );
    });

    it('rejects disabled users during refresh', async () => {
        prismaService.authSession.findUnique.mockResolvedValue({
            id: 'session-1',
            userId: 'user-1',
            expiresAt: new Date(Date.now() + 60_000),
            revokedAt: null,
            user: {
                id: 'user-1',
                name: 'Customer',
                email: 'customer@example.com',
                role: UserRole.CUSTOMER,
                status: UserStatus.DISABLED,
            },
        });

        await expect(service.refresh('refresh-token')).rejects.toThrow(
            AppException,
        );
    });

    it('logs out by revoking the active refresh session', async () => {
        prismaService.authSession.updateMany.mockResolvedValue({ count: 1 });

        await expect(service.logout('refresh-token')).resolves.toBeUndefined();
        expect(prismaService.authSession.updateMany).toHaveBeenCalledWith({
            where: {
                tokenHash: hashTestRefreshToken('refresh-token'),
                revokedAt: null,
            },
            data: {
                revokedAt: expect.any(Date),
            },
        });
    });

    it('ignores logout without a refresh token', async () => {
        await expect(service.logout(null)).resolves.toBeUndefined();
        expect(prismaService.authSession.updateMany).not.toHaveBeenCalled();
    });
});

function createUserServiceMock() {
    return {
        createUser: jest.fn<() => Promise<unknown>>(),
        findAuthUserByEmail: jest.fn<() => Promise<unknown>>(),
        findPublicUserById: jest.fn<() => Promise<unknown>>(),
        toPublicUser: jest.fn((user: Record<string, unknown>) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        })),
    };
}

function createPasswordHasherMock() {
    return {
        hash: jest.fn<() => Promise<string>>(),
        verify: jest.fn<() => Promise<boolean>>(),
    };
}

function createJwtServiceMock() {
    return {
        signAsync: jest.fn<() => Promise<string>>(),
    };
}

function createPrismaServiceMock() {
    const authSession = {
        create: jest.fn<(args: unknown) => Promise<unknown>>(),
        findUnique: jest.fn<(args: unknown) => Promise<unknown>>(),
        updateMany: jest.fn<(args: unknown) => Promise<{ count: number }>>(),
    };
    const transaction = { authSession };

    return {
        authSession,
        $transaction: jest.fn<
            (
                callback: (
                    transactionClient: typeof transaction,
                ) => Promise<unknown>,
            ) => Promise<unknown>
        >((callback) => callback(transaction)),
    };
}

function createConfigServiceMock() {
    return {
        get: jest.fn((key: string) =>
            key === 'NODE_ENV' ? 'test' : undefined,
        ),
        getOrThrow: jest.fn((key: string) => {
            if (key === 'JWT_REFRESH_TOKEN_EXPIRES_IN') {
                return '7d';
            }

            throw new Error(`Unexpected config key: ${key}`);
        }),
    };
}

function hashTestRefreshToken(refreshToken: string) {
    return createHash('sha256').update(refreshToken).digest('hex');
}
