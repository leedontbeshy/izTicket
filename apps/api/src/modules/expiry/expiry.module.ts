import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ExpiryController } from './expiry.controller';
import { ExpiryService } from './expiry.service';

@Module({
    imports: [PrismaModule, AuthModule],
    controllers: [ExpiryController],
    providers: [ExpiryService],
    exports: [ExpiryService],
})
export class ExpiryModule {}
