import { Injectable } from '@nestjs/common';
import { UserRole, UserStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { AppException } from '../../common/errors/app.exception';

export interface PublicUser {
    id: string;
    name: string;
    email: string;
    role: UserRole;
}

export interface AuthUser extends PublicUser {
    passwordHash: string;
    status: UserStatus;
}

export interface CreateUserInput {
    name: string;
    email: string;
    passwordHash: string;
    role: UserRole;
}

const authUserSelect = {
    id: true,
    name: true,
    email: true,
    role: true,
    status: true,
    passwordHash: true,
} as const;

@Injectable()
export class UsersService {
    constructor(private readonly prismaService: PrismaService) {}

    normalizeEmail(email: string) {
        return email.trim().toLowerCase();
    }

    toPublicUser(user: PublicUser): PublicUser {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        };
    }

    async createUser(input: CreateUserInput): Promise<PublicUser> {
        const email = this.normalizeEmail(input.email);
        const existingUser = await this.prismaService.user.findUnique({
            where: { email },
            select: { id: true },
        });

        if (existingUser) {
            throw AppException.conflict('Email is already registered.');
        }

        try {
            const user = await this.prismaService.user.create({
                data: {
                    email,
                    name: input.name.trim(),
                    passwordHash: input.passwordHash,
                    role: input.role,
                    status: UserStatus.ACTIVE,
                },
                select: authUserSelect,
            });

            return this.toPublicUser(user);
        } catch (error: unknown) {
            if (isPrismaUniqueConstraintError(error)) {
                throw AppException.conflict('Email is already registered.');
            }

            throw error;
        }
    }

    async findAuthUserByEmail(email: string): Promise<AuthUser | null> {
        return this.prismaService.user.findUnique({
            where: { email: this.normalizeEmail(email) },
            select: authUserSelect,
        });
    }

    async findAuthUserById(id: string): Promise<AuthUser | null> {
        return this.prismaService.user.findUnique({
            where: { id },
            select: authUserSelect,
        });
    }

    async findPublicUserById(id: string): Promise<PublicUser> {
        const user = await this.findAuthUserById(id);

        if (!user) {
            throw AppException.notFound('User was not found.');
        }

        return this.toPublicUser(user);
    }
}

function isPrismaUniqueConstraintError(error: unknown) {
    return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
    );
}
