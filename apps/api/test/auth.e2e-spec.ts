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
import { UsersModule } from '../src/modules/users/users.module';
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
    imports: [AuthModule, UsersModule],
    controllers: [TestOnlyController],
})
class TestOnlyAuthModule {}

describe('Auth (e2e)', () => {
    let app: INestApplication;
    let prismaService: PrismaService;
    let server: Server;
    let accessToken: string;

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
        await cleanupTestUsers();
    });

    afterAll(async () => {
        await cleanupTestUsers();
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
                accessToken = body.accessToken;
            });
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

    it('rejects users without the required role', async () => {
        await request(server)
            .get('/api/v1/test-only/admin')
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(403);
    });

    async function cleanupTestUsers() {
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
