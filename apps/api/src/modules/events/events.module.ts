import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { OrganizerEventsController } from './organizer-events.controller';

@Module({
    imports: [PrismaModule, AuthModule],
    controllers: [EventsController, OrganizerEventsController],
    providers: [EventsService],
    exports: [EventsService],
})
export class EventsModule {}
