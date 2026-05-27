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

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    @Post()
    createOrder(
        @CurrentUser('id') customerId: string,
        @Body() dto: CreateOrderDto,
    ) {
        return this.ordersService.createOrder(customerId, dto);
    }

    @Get('my')
    listMyOrders(
        @CurrentUser('id') customerId: string,
        @Query() query: PaginationQueryDto,
    ) {
        return this.ordersService.listMyOrders(customerId, query);
    }

    @Get(':orderId')
    getOrder(
        @CurrentUser('id') customerId: string,
        @Param('orderId', ParseUUIDPipe) orderId: string,
    ) {
        return this.ordersService.getOrder(customerId, orderId);
    }
}
