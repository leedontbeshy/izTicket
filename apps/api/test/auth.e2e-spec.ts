import { Controller, Get, Module, UseGuards } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import type { Server } from 'node:http';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { Roles } from '../src/common/decorators/roles.decorator';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { configureApp } from '../src/common/utils/configure-app';
import { UserRole } from '../src/generated/prisma/enums';
import { AuthModule } from '../src/modules/auth/auth.module';
import { UserModule } from '../src/modules/user/user.module';
import { PrismaService } from '../src/prisma/prisma.service';

@Controller('test-only')
class TestOnlyController {
    @Get('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    getAdminOnly() {
        return { ok: true };
    }
}

@Module({
    imports: [AuthModule, UserModule],
    controllers: [TestOnlyController],
})
class TestOnlyAuthModule {}

describe('Auth (e2e)', () => {
    let app: INestApplication;
    let prismaService: PrismaService;
    let server: Server;
    let accessToken: string;
    let refreshCookie: string;
    let rotatedRefreshCookie: string;

    const runId = `m3-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const email = `customer-${runId}@example.com`;
    const password = 'Password123';

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule, TestOnlyAuthModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        configureApp(app);
        await app.init();

        prismaService = app.get(PrismaService);
        server = app.getHttpServer() as Server;
        await cleanupTestUser();
    });

    afterAll(async () => {
        await cleanupTestUser();
        await app?.close();
    });

    it('registers a customer', async () => {
        await request(server)
            .post('/api/v1/auth/register')
            .send({
                name: 'M3 Customer',
                email,
                password,
                role: UserRole.CUSTOMER,
            })
            .expect(201)
            .expect((response) => {
                const body: unknown = response.body;

                expectPublicUserResponse(body, email);
                expect('passwordHash' in body).toBe(false);
            });
    });

    it('logs in the registered customer', async () => {
        await request(server)
            .post('/api/v1/auth/login')
            .send({
                email,
                password,
            })
            .expect(201)
            .expect((response) => {
                const body: unknown = response.body;

                expectLoginResponse(body, email);
                refreshCookie = expectRefreshCookie(response.headers);
                accessToken = body.accessToken;
            });
    });

    it('refreshes the access token with the refresh cookie', async () => {
        await request(server)
            .post('/api/v1/auth/refresh')
            .set('Cookie', refreshCookie)
            .expect(200)
            .expect((response) => {
                const body: unknown = response.body;

                expectLoginResponse(body, email);
                rotatedRefreshCookie = expectRefreshCookie(response.headers);
                expect(rotatedRefreshCookie).not.toBe(refreshCookie);
                accessToken = body.accessToken;
            });
    });

    it('rejects a rotated refresh token after it has been used', async () => {
        await request(server)
            .post('/api/v1/auth/refresh')
            .set('Cookie', refreshCookie)
            .expect(401);
    });

    it('logs out by revoking the current refresh token', async () => {
        await request(server)
            .post('/api/v1/auth/logout')
            .set('Cookie', rotatedRefreshCookie)
            .expect(204)
            .expect((response) => {
                expectRefreshCookieClearHeader(response.headers);
            });

        await request(server)
            .post('/api/v1/auth/refresh')
            .set('Cookie', rotatedRefreshCookie)
            .expect(401);
    });

    it('returns the current user with a bearer token', async () => {
        await request(server)
            .get('/api/v1/auth/me')
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(200)
            .expect((response) => {
                const body: unknown = response.body;

                expectPublicUserResponse(body, email);
            });
    });

    it('rejects missing bearer tokens', async () => {
        await request(server).get('/api/v1/auth/me').expect(401);
    });

    it('rejects a user without the required role', async () => {
        await request(server)
            .get('/api/v1/test-only/admin')
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(403);
    });

    async function cleanupTestUser() {
        if (!prismaService) {
            return;
        }

        await prismaService.user.deleteMany({
            where: {
                email: {
                    contains: runId,
                },
            },
        });
    }
});

interface PublicUserResponseBody {
    id: string;
    name: string;
    email: string;
    role: UserRole;
}

interface LoginResponseBody {
    accessToken: string;
    user: PublicUserResponseBody;
}

function expectPublicUserResponse(
    body: unknown,
    email: string,
): asserts body is PublicUserResponseBody {
    expect(isRecord(body)).toBe(true);

    if (!isRecord(body)) {
        throw new Error('Expected response body to be an object.');
    }

    expect(typeof body.id).toBe('string');
    expect(body.name).toBe('M3 Customer');
    expect(body.email).toBe(email);
    expect(body.role).toBe(UserRole.CUSTOMER);
}

function expectLoginResponse(
    body: unknown,
    email: string,
): asserts body is LoginResponseBody {
    expect(isRecord(body)).toBe(true);

    if (!isRecord(body)) {
        throw new Error('Expected login response body to be an object.');
    }

    expect(typeof body.accessToken).toBe('string');
    expectPublicUserResponse(body.user, email);
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function expectRefreshCookie(headers: Record<string, unknown>) {
    const cookie = getRefreshCookieHeader(headers);

    expect(cookie).toContain('izticket_refresh_token=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Path=/api/v1/auth');
    expect(cookie).toContain('SameSite=Lax');

    return cookie.split(';')[0];
}

function expectRefreshCookieClearHeader(headers: Record<string, unknown>) {
    const cookie = getRefreshCookieHeader(headers);

    expect(cookie).toContain('izticket_refresh_token=');
    expect(cookie).toContain('Path=/api/v1/auth');
    expect(cookie).toContain('Expires=');
}

function getRefreshCookieHeader(headers: Record<string, unknown>) {
    const setCookie = headers['set-cookie'];
    const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
    const refreshCookie = cookies
        .filter((cookie): cookie is string => typeof cookie === 'string')
        .find((cookie) => cookie.startsWith('izticket_refresh_token='));

    if (!refreshCookie) {
        throw new Error('Expected refresh token cookie header.');
    }

    return refreshCookie;
}
