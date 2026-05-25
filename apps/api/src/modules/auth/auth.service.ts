import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole, UserStatus } from '../../generated/prisma/enums';
import { AppException } from '../../common/errors/app.exception';
import type { PublicUser } from '../user/user.service';
import { UserService } from '../user/user.service';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import { PasswordHasher } from './password-hasher.service';
import type { AuthTokenPayload, LoginResponse } from './auth.types';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly passwordHasher: PasswordHasher,
        private readonly jwtService: JwtService,
    ) {}

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

    async login(dto: LoginDto): Promise<LoginResponse> {
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

        return {
            accessToken: await this.signAccessToken(user),
            user: this.userService.toPublicUser(user),
        };
    }

    getMe(userId: string): Promise<PublicUser> {
        return this.userService.findPublicUserById(userId);
    }

    private signAccessToken(user: PublicUser) {
        const payload: AuthTokenPayload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        return this.jwtService.signAsync(payload);
    }
}

function invalidCredentials() {
    return AppException.unauthorized('Invalid email or password.');
}
