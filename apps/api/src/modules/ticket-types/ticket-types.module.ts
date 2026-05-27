import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { OrganizerTicketTypesController } from './organizer-ticket-types.controller';
import { TicketTypesService } from './ticket-types.service';

@Module({
    imports: [PrismaModule, AuthModule],
    controllers: [OrganizerTicketTypesController],
    providers: [TicketTypesService],
})
export class TicketTypesModule {}
