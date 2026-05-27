import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';

@Module({
    imports: [PrismaModule, AuthModule],
    controllers: [ReservationsController],
    providers: [ReservationsService],
})
export class ReservationsModule {}
