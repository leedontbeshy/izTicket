import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../generated/prisma/enums';
import { CreateTicketTypeDto } from './dto/create-ticket-type.dto';
import { UpdateTicketTypeDto } from './dto/update-ticket-type.dto';
import { TicketTypesService } from './ticket-types.service';

@Controller('organizer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ORGANIZER)
export class OrganizerTicketTypesController {
    constructor(private readonly ticketTypesService: TicketTypesService) {}

    @Get('events/:eventId/ticket-types')
    listTicketTypes(
        @CurrentUser('id') organizerId: string,
        @Param('eventId', ParseUUIDPipe) eventId: string,
    ) {
        return this.ticketTypesService.listOrganizerTicketTypes(
            organizerId,
            eventId,
        );
    }

    @Post('events/:eventId/ticket-types')
    createTicketType(
        @CurrentUser('id') organizerId: string,
        @Param('eventId', ParseUUIDPipe) eventId: string,
        @Body() dto: CreateTicketTypeDto,
    ) {
        return this.ticketTypesService.createOrganizerTicketType(
            organizerId,
            eventId,
            dto,
        );
    }

    @Patch('ticket-types/:ticketTypeId')
    updateTicketType(
        @CurrentUser('id') organizerId: string,
        @Param('ticketTypeId', ParseUUIDPipe) ticketTypeId: string,
        @Body() dto: UpdateTicketTypeDto,
    ) {
        return this.ticketTypesService.updateOrganizerTicketType(
            organizerId,
            ticketTypeId,
            dto,
        );
    }
}
