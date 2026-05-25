import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { PrismaClient } from '../src/generated/prisma/client.ts';
import { UserRole, UserStatus } from '../src/generated/prisma/enums.ts';

config({ path: resolve(process.cwd(), '../../.env') });
config({ path: resolve(process.cwd(), '.env'), override: true });

function resolveDatasourceUrl() {
    if (process.env.DIRECT_URL) {
        return process.env.DIRECT_URL;
    }

    if (process.env.DATABASE_URL) {
        return process.env.DATABASE_URL.replace('-pooler.', '.');
    }

    throw new Error('DIRECT_URL or DATABASE_URL is required.');
}

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: resolveDatasourceUrl() }),
});

const demoUsers = [
    {
        email: 'admin@izticket.local',
        name: 'izTicket Admin',
        role: UserRole.ADMIN,
    },
    {
        email: 'organizer@izticket.local',
        name: 'Demo Organizer',
        role: UserRole.ORGANIZER,
    },
    {
        email: 'customer@izticket.local',
        name: 'Demo Customer',
        role: UserRole.CUSTOMER,
    },
] as const;

async function main() {
    const passwordHash = await argon2.hash('Password123!');

    for (const user of demoUsers) {
        await prisma.user.upsert({
            where: { email: user.email },
            update: {
                name: user.name,
                role: user.role,
                status: UserStatus.ACTIVE,
                passwordHash,
            },
            create: {
                email: user.email,
                name: user.name,
                role: user.role,
                status: UserStatus.ACTIVE,
                passwordHash,
            },
        });
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (error: unknown) => {
        console.error(error);
        await prisma.$disconnect();
        process.exit(1);
    });
