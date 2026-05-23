import { Test, TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import type { Server } from 'node:http';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('AppController (e2e)', () => {
    let app: INestApplication;
    let queryRaw: () => Promise<unknown>;
    let prismaService: {
        $queryRaw: (...args: unknown[]) => Promise<unknown>;
    };

    beforeEach(async () => {
        queryRaw = () => Promise.resolve([{ '?column?': 1 }]);
        prismaService = {
            $queryRaw: async () => queryRaw(),
        };

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(PrismaService)
            .useValue(prismaService)
            .compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterEach(async () => {
        await app?.close();
    });

    it('/ (GET)', () => {
        const server = app.getHttpServer() as Server;

        return request(server)
            .get('/')
            .expect(200)
            .expect('API template is running.');
    });

    it('/health/live (GET)', () => {
        const server = app.getHttpServer() as Server;

        return request(server).get('/health/live').expect(200).expect({
            status: 'ok',
        });
    });

    it('/health/ready (GET) returns ok when the database responds', () => {
        queryRaw = () => Promise.resolve([{ '?column?': 1 }]);
        const server = app.getHttpServer() as Server;

        return request(server)
            .get('/health/ready')
            .expect(200)
            .expect({
                status: 'ok',
                checks: {
                    database: 'ok',
                },
            });
    });

    it('/health/ready (GET) returns 503 when the database fails', () => {
        queryRaw = () => Promise.reject(new Error('database down'));
        const server = app.getHttpServer() as Server;

        return request(server)
            .get('/health/ready')
            .expect(503)
            .expect({
                status: 'error',
                checks: {
                    database: 'error',
                },
            });
    });
});
