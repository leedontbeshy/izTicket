import { Test, TestingModule } from '@nestjs/testing';
import { jest } from '@jest/globals';
import { AuthService } from './auth.service';
import { UserRole, UserStatus } from '../../generated/prisma/enums';
import { AppException } from '../../common/errors/app.exception';
import { UsersService } from '../users/users.service';
import { PasswordHasher } from './password-hasher.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
    let service: AuthService;
    let usersService: ReturnType<typeof createUsersServiceMock>;
    let passwordHasher: ReturnType<typeof createPasswordHasherMock>;
    let jwtService: ReturnType<typeof createJwtServiceMock>;

    beforeEach(async () => {
        usersService = createUsersServiceMock();
        passwordHasher = createPasswordHasherMock();
        jwtService = createJwtServiceMock();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: UsersService,
                    useValue: usersService,
                },
                {
                    provide: PasswordHasher,
                    useValue: passwordHasher,
                },
                {
                    provide: JwtService,
                    useValue: jwtService,
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
        usersService.createUser.mockResolvedValue({
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
        expect(usersService.createUser).toHaveBeenCalledWith({
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
        usersService.findAuthUserByEmail.mockResolvedValue({
            id: 'user-1',
            name: 'Customer',
            email: 'customer@example.com',
            role: UserRole.CUSTOMER,
            status: UserStatus.ACTIVE,
            passwordHash: 'hashed-password',
        });
        passwordHasher.verify.mockResolvedValue(true);
        jwtService.signAsync.mockResolvedValue('access-token');

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
        });
        expect(jwtService.signAsync).toHaveBeenCalledWith({
            sub: 'user-1',
            email: 'customer@example.com',
            role: UserRole.CUSTOMER,
        });
    });

    it('rejects login with a wrong password', async () => {
        usersService.findAuthUserByEmail.mockResolvedValue({
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

    it('rejects disabled users during login', async () => {
        usersService.findAuthUserByEmail.mockResolvedValue({
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
});

function createUsersServiceMock() {
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
