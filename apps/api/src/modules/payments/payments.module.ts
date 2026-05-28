import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { SepayPaymentReferenceService } from './sepay/sepay-payment-reference.service';
import { SepayQrService } from './sepay/sepay-qr.service';
import { SepayWebhookVerifierService } from './sepay/sepay-webhook-verifier.service';

@Module({
    imports: [PrismaModule, AuthModule],
    controllers: [PaymentsController],
    providers: [
        PaymentsService,
        SepayPaymentReferenceService,
        SepayQrService,
        SepayWebhookVerifierService,
    ],
})
export class PaymentsModule {}
