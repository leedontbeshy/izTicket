import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import {
    CurrentUser,
    type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../generated/prisma/enums';
import { PaymentsService } from './payments.service';
import { CreateSepayPaymentDto } from './dto/create-sepay-payment.dto';

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) {}

    @Post('sepay/create')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CUSTOMER)
    createPayment(
        @CurrentUser('id') customerId: string,
        @Body() dto: CreateSepayPaymentDto,
    ) {
        return this.paymentsService.createSepayPayment(
            customerId,
            dto.orderId,
            dto.returnUrl,
        );
    }

    @Post('sepay/webhook')
    @HttpCode(HttpStatus.OK)
    async handleWebhook(@Req() request: RawBodyRequest<Request>) {
        await this.paymentsService.handleSepayWebhook({
            headers: request.headers as Record<
                string,
                string | string[] | undefined
            >,
            rawBody: request.rawBody ?? Buffer.alloc(0),
            body: request.body,
        });
        return { success: true };
    }

    @Get(':paymentId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    getPayment(
        @CurrentUser() user: AuthenticatedUser,
        @Param('paymentId', ParseUUIDPipe) paymentId: string,
    ) {
        return this.paymentsService.getPayment(user, paymentId);
    }
}
