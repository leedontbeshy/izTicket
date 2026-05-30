import {
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    UseGuards,
} from '@nestjs/common';
import {
    CurrentUser,
    type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../generated/prisma/enums';
import { TicketsService } from './tickets.service';

@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
    constructor(private readonly ticketsService: TicketsService) {}

    @Get('my')
    @Roles(UserRole.CUSTOMER)
    listMyTickets(@CurrentUser('id') customerId: string) {
        return this.ticketsService.listCustomerTickets(customerId);
    }

    @Get(':ticketId')
    getTicket(
        @CurrentUser() user: AuthenticatedUser,
        @Param('ticketId', ParseUUIDPipe) ticketId: string,
    ) {
        return this.ticketsService.getTicket(user, ticketId);
    }
}
