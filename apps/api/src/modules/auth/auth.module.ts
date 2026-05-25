import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PrismaModule } from '../../prisma/prisma.module';
import { UserModule } from '../user/user.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PasswordHasher } from './password-hasher.service';

type JwtExpiresIn =
    | number
    | `${number}ms`
    | `${number}s`
    | `${number}m`
    | `${number}h`
    | `${number}d`
    | `${number}w`
    | `${number}y`;

@Module({
    controllers: [AuthController],
    providers: [AuthService, PasswordHasher, JwtAuthGuard, RolesGuard],
    imports: [
        ConfigModule,
        PrismaModule,
        UserModule,
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.getOrThrow<string>('JWT_SECRET'),
                signOptions: {
                    expiresIn: getJwtExpiresIn(configService),
                    issuer: configService.getOrThrow<string>('JWT_ISSUER'),
                    audience: configService.getOrThrow<string>('JWT_AUDIENCE'),
                },
                verifyOptions: {
                    issuer: configService.getOrThrow<string>('JWT_ISSUER'),
                    audience: configService.getOrThrow<string>('JWT_AUDIENCE'),
                },
            }),
        }),
    ],
    exports: [JwtAuthGuard, RolesGuard, JwtModule],
})
export class AuthModule {}

function getJwtExpiresIn(configService: ConfigService): JwtExpiresIn {
    return configService.getOrThrow<string>(
        'JWT_ACCESS_TOKEN_EXPIRES_IN',
    ) as JwtExpiresIn;
}
