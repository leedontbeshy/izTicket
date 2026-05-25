import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { CookieOptions } from 'express';
import { createHash, randomBytes } from 'node:crypto';
import { UserRole, UserStatus } from '../../generated/prisma/enums';
import { AppException } from '../../common/errors/app.exception';
import { PrismaService } from '../../prisma/prisma.service';
import type { PublicUser } from '../user/user.service';
import { UserService } from '../user/user.service';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import { PasswordHasher } from './password-hasher.service';
import type { AuthSessionResponse, AuthTokenPayload } from './auth.types';
import type { RefreshTokenCookie } from './auth-cookie';
import { REFRESH_TOKEN_COOKIE_PATH } from './auth-cookie';

const RefreshTokenByteLength = 48;

const refreshSessionUserSelect = {
    id: true,
    name: true,
    email: true,
    role: true,
    status: true,
} as const;

@Injectable()
export class AuthService {
    private readonly refreshTokenExpiresInMs: number;
    private readonly refreshTokenCookieSecure: boolean;

    constructor(
        private readonly userService: UserService,
        private readonly passwordHasher: PasswordHasher,
        private readonly jwtService: JwtService,
        private readonly prismaService: PrismaService,
        configService: ConfigService,
    ) {
        this.refreshTokenExpiresInMs = parseDurationMs(
            configService.getOrThrow<string>('JWT_REFRESH_TOKEN_EXPIRES_IN'),
        );
        this.refreshTokenCookieSecure =
            configService.get<string>('NODE_ENV') === 'production';
    }

    async register(dto: RegisterDto): Promise<PublicUser> {
        if (dto.role === UserRole.ADMIN) {
            throw AppException.forbidden(
                'Public registration as admin is not allowed.',
            );
        }

        const passwordHash = await this.passwordHasher.hash(dto.password);

        return this.userService.createUser({
            name: dto.name,
            email: dto.email,
            passwordHash,
            role: dto.role,
        });
    }

    async login(dto: LoginDto): Promise<AuthSessionResponse> {
        const user = await this.userService.findAuthUserByEmail(dto.email);

        if (!user) {
            throw invalidCredentials();
        }

        if (user.status === UserStatus.DISABLED) {
            throw AppException.forbidden('This account is disabled.');
        }

        const passwordIsValid = await this.passwordHasher.verify(
            user.passwordHash,
            dto.password,
        );

        if (!passwordIsValid) {
            throw invalidCredentials();
        }

        const refreshTokenCookie = await this.createRefreshSession(user.id);

        return {
            accessToken: await this.signAccessToken(user),
            user: this.userService.toPublicUser(user),
            refreshTokenCookie,
        };
    }

    async refresh(refreshToken: string | null): Promise<AuthSessionResponse> {
        if (!refreshToken) {
            throw invalidRefreshToken();
        }

        const tokenHash = hashRefreshToken(refreshToken);
        const now = new Date();
        const session = await this.prismaService.authSession.findUnique({
            where: { tokenHash },
            select: {
                id: true,
                userId: true,
                expiresAt: true,
                revokedAt: true,
                user: {
                    select: refreshSessionUserSelect,
                },
            },
        });

        if (
            !session ||
            session.revokedAt ||
            session.expiresAt.getTime() <= now.getTime() ||
            session.user.status === UserStatus.DISABLED
        ) {
            throw invalidRefreshToken();
        }

        const refreshTokenCookie = await this.rotateRefreshSession(
            session.id,
            session.userId,
            now,
        );

        return {
            accessToken: await this.signAccessToken(session.user),
            user: this.userService.toPublicUser(session.user),
            refreshTokenCookie,
        };
    }

    async logout(refreshToken: string | null): Promise<void> {
        if (!refreshToken) {
            return;
        }

        await this.prismaService.authSession.updateMany({
            where: {
                tokenHash: hashRefreshToken(refreshToken),
                revokedAt: null,
            },
            data: {
                revokedAt: new Date(),
            },
        });
    }

    getMe(userId: string): Promise<PublicUser> {
        return this.userService.findPublicUserById(userId);
    }

    getRefreshTokenClearCookieOptions(): CookieOptions {
        return this.getRefreshTokenCookieOptions();
    }

    private signAccessToken(user: PublicUser) {
        const payload: AuthTokenPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        return this.jwtService.signAsync(payload);
    }

    private async createRefreshSession(
        userId: string,
    ): Promise<RefreshTokenCookie> {
        const refreshToken = generateRefreshToken();
        const expiresAt = this.getRefreshTokenExpiresAt();

        await this.prismaService.authSession.create({
            data: {
                userId,
                tokenHash: hashRefreshToken(refreshToken),
                expiresAt,
            },
        });

        return this.toRefreshTokenCookie(refreshToken);
    }

    private async rotateRefreshSession(
        sessionId: string,
        userId: string,
        revokedAt: Date,
    ): Promise<RefreshTokenCookie> {
        const refreshToken = generateRefreshToken();
        const expiresAt = this.getRefreshTokenExpiresAt();

        await this.prismaService.$transaction(async (transaction) => {
            const revokeResult = await transaction.authSession.updateMany({
                where: {
                    id: sessionId,
                    revokedAt: null,
                },
                data: {
                    revokedAt,
                },
            });

            if (revokeResult.count !== 1) {
                throw invalidRefreshToken();
            }

            await transaction.authSession.create({
                data: {
                    userId,
                    tokenHash: hashRefreshToken(refreshToken),
                    expiresAt,
                },
            });
        });

        return this.toRefreshTokenCookie(refreshToken);
    }

    private getRefreshTokenExpiresAt() {
        return new Date(Date.now() + this.refreshTokenExpiresInMs);
    }

    private toRefreshTokenCookie(value: string): RefreshTokenCookie {
        return {
            value,
            options: {
                ...this.getRefreshTokenCookieOptions(),
                maxAge: this.refreshTokenExpiresInMs,
            },
        };
    }

    private getRefreshTokenCookieOptions(): CookieOptions {
        return {
            httpOnly: true,
            sameSite: 'lax',
            secure: this.refreshTokenCookieSecure,
            path: REFRESH_TOKEN_COOKIE_PATH,
        };
    }
}

function invalidCredentials() {
    return AppException.unauthorized('Invalid email or password.');
}

function invalidRefreshToken() {
    return AppException.unauthorized('Invalid or expired refresh token.');
}

function generateRefreshToken() {
    return randomBytes(RefreshTokenByteLength).toString('base64url');
}

function hashRefreshToken(refreshToken: string) {
    return createHash('sha256').update(refreshToken).digest('hex');
}

function parseDurationMs(duration: string) {
    const match = /^(\d+)(ms|s|m|h|d|w|y)$/.exec(duration);

    if (!match) {
        throw new Error(`Invalid duration: ${duration}`);
    }

    const value = Number(match[1]);
    const unit = match[2];

    switch (unit) {
        case 'ms':
            return value;
        case 's':
            return value * 1000;
        case 'm':
            return value * 60 * 1000;
        case 'h':
            return value * 60 * 60 * 1000;
        case 'd':
            return value * 24 * 60 * 60 * 1000;
        case 'w':
            return value * 7 * 24 * 60 * 60 * 1000;
        case 'y':
            return value * 365 * 24 * 60 * 60 * 1000;
        default:
            throw new Error(`Invalid duration unit: ${unit}`);
    }
}
