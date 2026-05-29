import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '../generated/prisma/client';

function loadEnv() {
    const cwd = process.cwd();
    const isApiCwd = existsSync(resolve(cwd, 'prisma/schema.prisma'));

    const rootEnvPath = isApiCwd
        ? resolve(cwd, '../../.env')
        : resolve(cwd, '.env');
    const apiEnvPath = isApiCwd
        ? resolve(cwd, '.env')
        : resolve(cwd, 'apps/api/.env');

    config({ path: rootEnvPath });
    config({ path: apiEnvPath, override: true });
}

loadEnv();

function resolveDatasourceUrl() {
    if (process.env.DIRECT_URL) {
        return process.env.DIRECT_URL;
    }

    if (process.env.DATABASE_URL) {
        return process.env.DATABASE_URL.replace('-pooler.', '.');
    }

    throw new Error('DIRECT_URL or DATABASE_URL is required.');
}

@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy
{
    constructor() {
        super({
            adapter: new PrismaPg({
                connectionString: resolveDatasourceUrl(),
                keepAlive: true,
                max: 5,
            }),
        });
    }

    async onModuleInit() {
        await this.$connect();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
