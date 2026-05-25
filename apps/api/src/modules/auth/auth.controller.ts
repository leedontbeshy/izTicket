import {
    Body,
    Controller,
    Get,
    Headers,
    HttpCode,
    HttpStatus,
    Post,
    Res,
    UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
    CurrentUser,
    type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import type { AuthSessionResponse, LoginResponse } from './auth.types';
import {
    clearRefreshTokenCookie,
    getRefreshTokenCookie,
    setRefreshTokenCookie,
} from './auth-cookie';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Post('login')
    async login(
        @Body() dto: LoginDto,
        @Res({ passthrough: true }) response: Response,
    ) {
        return sendAuthSessionResponse(
            response,
            await this.authService.login(dto),
        );
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(
        @Headers('cookie') cookieHeader: string | string[] | undefined,
        @Res({ passthrough: true }) response: Response,
    ) {
        return sendAuthSessionResponse(
            response,
            await this.authService.refresh(getRefreshTokenCookie(cookieHeader)),
        );
    }

    @Post('logout')
    @HttpCode(HttpStatus.NO_CONTENT)
    async logout(
        @Headers('cookie') cookieHeader: string | string[] | undefined,
        @Res({ passthrough: true }) response: Response,
    ) {
        await this.authService.logout(getRefreshTokenCookie(cookieHeader));
        clearRefreshTokenCookie(
            response,
            this.authService.getRefreshTokenClearCookieOptions(),
        );
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    getMe(@CurrentUser() user: AuthenticatedUser) {
        return this.authService.getMe(user.id);
    }
}

function sendAuthSessionResponse(
    response: Response,
    authSession: AuthSessionResponse,
): LoginResponse {
    const { refreshTokenCookie, ...body } = authSession;

    setRefreshTokenCookie(response, refreshTokenCookie);

    return body;
}
