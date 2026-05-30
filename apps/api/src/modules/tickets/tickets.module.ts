import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

@Module({
    imports: [PrismaModule, AuthModule],
    controllers: [TicketsController],
    providers: [TicketsService],
})
export class TicketsModule {}
