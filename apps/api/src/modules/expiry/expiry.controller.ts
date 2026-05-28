import {
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../generated/prisma/enums';
import { ExpiryService } from './expiry.service';

@Controller('admin/expiry')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ExpiryController {
    constructor(private readonly expiryService: ExpiryService) {}

    @Post('process')
    @HttpCode(HttpStatus.OK)
    processExpired() {
        return this.expiryService.processExpired();
    }
}
