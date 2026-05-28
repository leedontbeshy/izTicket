import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SepayPaymentReferenceService } from './sepay/sepay-payment-reference.service';
import { SepayQrService } from './sepay/sepay-qr.service';
import { SepayWebhookVerifierService } from './sepay/sepay-webhook-verifier.service';

type WebhookInput = {
    headers: Record<string, string | string[] | undefined>;
    rawBody: Buffer;
    body: unknown;
};

@Injectable()
export class PaymentsService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly referenceService: SepayPaymentReferenceService,
        private readonly qrService: SepayQrService,
        private readonly webhookVerifierService: SepayWebhookVerifierService,
    ) {}

    // Task 2: implemented in payments task 2
    async createSepayPayment(
        _customerId: string,
        _orderId: string,
    ): Promise<never> {
        throw new Error('Not implemented');
    }

    // Task 3: implemented in payments task 3
    async handleSepayWebhook(_input: WebhookInput): Promise<void> {
        throw new Error('Not implemented');
    }
}
