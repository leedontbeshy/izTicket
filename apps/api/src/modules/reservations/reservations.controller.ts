import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Post,
    UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/enums';
import { ReservationsService } from './reservations.service';
import type { CreateReservationDto } from './dto/create-reservation.dto';

@Controller('reservations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
export class ReservationsController {
    constructor(private readonly reservationsService: ReservationsService) {}

    @Post()
    createReservation(
        @CurrentUser('id') customerId: string,
        @Body() dto: CreateReservationDto,
    ) {
        return this.reservationsService.createReservation(customerId, dto);
    }

    @Get(':reservationId')
    getReservation(
        @CurrentUser('id') customerId: string,
        @Param('reservationId', ParseUUIDPipe) reservationId: string,
    ) {
        return this.reservationsService.getReservation(
            customerId,
            reservationId,
        );
    }

    @Post(':reservationId/cancel')
    @HttpCode(HttpStatus.OK)
    cancelReservation(
        @CurrentUser('id') customerId: string,
        @Param('reservationId', ParseUUIDPipe) reservationId: string,
    ) {
        return this.reservationsService.cancelReservation(
            customerId,
            reservationId,
        );
    }
}
