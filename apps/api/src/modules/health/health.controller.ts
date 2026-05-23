import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('health')
export class HealthController {
    constructor(private readonly prismaService: PrismaService) {}

    @Get('live')
    getHealth() {
        return {
            status: 'ok',
        };
    }

    @Get('ready')
    async getReady(@Res({ passthrough: true }) response: Response) {
        try {
            await this.prismaService.$queryRaw`SELECT 1`;

            return {
                status: 'ok',
                checks: {
                    database: 'ok',
                },
            };
        } catch {
            response.status(HttpStatus.SERVICE_UNAVAILABLE);

            return {
                status: 'error',
                checks: {
                    database: 'error',
                },
            };
        }
    }
}
