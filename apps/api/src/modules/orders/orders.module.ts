import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { OrdersController } from './orders.controller';
import { OrganizerOrdersController } from './organizer-orders.controller';
import { OrdersService } from './orders.service';

@Module({
    imports: [PrismaModule, AuthModule],
    controllers: [OrdersController, OrganizerOrdersController],
    providers: [OrdersService],
})
export class OrdersModule {}
