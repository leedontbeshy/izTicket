import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';
import { UserRole } from '../../generated/prisma/enums';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventsService } from './events.service';

@Controller('organizer/events')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ORGANIZER)
export class OrganizerEventsController {
    constructor(private readonly eventsService: EventsService) {}

    @Get()
    listEvents(
        @CurrentUser('id') organizerId: string,
        @Query() query: PaginationQueryDto,
    ) {
        return this.eventsService.listOrganizerEvents(organizerId, query);
    }

    @Post()
    createEvent(
        @CurrentUser('id') organizerId: string,
        @Body() dto: CreateEventDto,
    ) {
        return this.eventsService.createOrganizerEvent(organizerId, dto);
    }

    @Patch(':eventId')
    updateEvent(
        @CurrentUser('id') organizerId: string,
        @Param('eventId', ParseUUIDPipe) eventId: string,
        @Body() dto: UpdateEventDto,
    ) {
        return this.eventsService.updateOrganizerEvent(
            organizerId,
            eventId,
            dto,
        );
    }

    @Post(':eventId/submit')
    @HttpCode(HttpStatus.OK)
    submitEvent(
        @CurrentUser('id') organizerId: string,
        @Param('eventId', ParseUUIDPipe) eventId: string,
    ) {
        return this.eventsService.submitOrganizerEvent(organizerId, eventId);
    }
}
