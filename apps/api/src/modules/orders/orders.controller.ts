import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
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
import type { CreateOrderDto } from './dto/create-order.dto';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    @Post()
    @Roles(UserRole.CUSTOMER)
    createOrder(
        @CurrentUser('id') customerId: string,
        @Body() dto: CreateOrderDto,
    ) {
        return this.ordersService.createOrder(customerId, dto);
    }

    @Get('my')
    @Roles(UserRole.CUSTOMER)
    listMyOrders(
        @CurrentUser('id') customerId: string,
        @Query() query: PaginationQueryDto,
    ) {
        return this.ordersService.listMyOrders(customerId, query);
    }

    @Get(':orderId')
    getOrder(
        @CurrentUser() user: AuthenticatedUser,
        @Param('orderId', ParseUUIDPipe) orderId: string,
    ) {
        return this.ordersService.getOrder(user, orderId);
    }
}
