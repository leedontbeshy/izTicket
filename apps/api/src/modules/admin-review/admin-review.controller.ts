import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseUUIDPipe,
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
import { AdminReviewService } from './admin-review.service';
import { RejectEventDto } from './dto/reject-event.dto';

@Controller('admin/events')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminReviewController {
    constructor(private readonly adminReviewService: AdminReviewService) {}

    @Get('pending')
    listPendingEvents(@Query() query: PaginationQueryDto) {
        return this.adminReviewService.listPendingEvents(query);
    }

    @Get(':eventId')
    getEvent(@Param('eventId', ParseUUIDPipe) eventId: string) {
        return this.adminReviewService.getEventDetail(eventId);
    }

    @Post(':eventId/approve')
    @HttpCode(HttpStatus.OK)
    approveEvent(
        @CurrentUser('id') adminId: string,
        @Param('eventId', ParseUUIDPipe) eventId: string,
    ) {
        return this.adminReviewService.approveEvent(adminId, eventId);
    }

    @Post(':eventId/reject')
    @HttpCode(HttpStatus.OK)
    rejectEvent(
        @CurrentUser('id') adminId: string,
        @Param('eventId', ParseUUIDPipe) eventId: string,
        @Body() dto: RejectEventDto,
    ) {
        return this.adminReviewService.rejectEvent(
            adminId,
            eventId,
            dto.reason,
        );
    }
}
