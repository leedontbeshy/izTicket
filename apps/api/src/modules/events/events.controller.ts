import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ListPublicEventsQueryDto } from './dto/list-public-events-query.dto';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
    constructor(private readonly eventsService: EventsService) {}

    @Get()
    listEvents(@Query() query: ListPublicEventsQueryDto) {
        return this.eventsService.listPublicEvents(query);
    }

    @Get(':eventId')
    getEvent(@Param('eventId', ParseUUIDPipe) eventId: string) {
        return this.eventsService.getPublicEvent(eventId);
    }
}
