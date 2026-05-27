import {
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Query,
    UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';
import { UserRole } from '../../generated/prisma/enums';
import { OrdersService } from './orders.service';

@Controller('organizer/events')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ORGANIZER)
export class OrganizerOrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    @Get(':eventId/orders')
    listEventOrders(
        @CurrentUser('id') organizerId: string,
        @Param('eventId', ParseUUIDPipe) eventId: string,
        @Query() query: PaginationQueryDto,
    ) {
        return this.ordersService.listEventOrders(organizerId, eventId, query);
    }
}
