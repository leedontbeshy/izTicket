import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AdminReviewController } from './admin-review.controller';
import { AdminReviewService } from './admin-review.service';

@Module({
    imports: [PrismaModule, AuthModule],
    controllers: [AdminReviewController],
    providers: [AdminReviewService],
})
export class AdminReviewModule {}
