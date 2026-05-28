import { Injectable } from '@nestjs/common';
import { AppException } from '../../common/errors/app.exception';
import { PrismaService } from '../../prisma/prisma.service';
import { SEPAY_PROVIDER } from './sepay/sepay-config';
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

    async createSepayPayment(customerId: string, orderId: string) {
        const order = await this.prismaService.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                customerId: true,
                status: true,
                totalAmountVnd: true,
                expiresAt: true,
                reservation: { select: { status: true } },
            },
        });

        if (!order) {
            throw AppException.notFound('Order was not found.');
        }

        if (order.customerId !== customerId) {
            throw AppException.forbidden(
                'You do not have permission to pay for this order.',
            );
        }

        if (order.status !== 'PENDING_PAYMENT') {
            throw AppException.conflict(
                'Order is not in PENDING_PAYMENT status.',
            );
        }

        if (order.reservation.status !== 'CONFIRMED') {
            throw AppException.conflict(
                'Reservation is not in a valid state for payment.',
            );
        }

        const existingPayment = await this.prismaService.payment.findFirst({
            where: { orderId, status: 'INITIATED' },
            select: { id: true },
        });

        if (existingPayment) {
            throw AppException.conflict(
                'Payment already initiated for this order.',
            );
        }

        const providerReference = this.referenceService.generate();
        const instructions = this.qrService.buildTransferInstructions(
            order.totalAmountVnd,
            providerReference,
        );

        const payment = await this.prismaService.payment.create({
            data: {
                orderId,
                provider: SEPAY_PROVIDER,
                providerReference,
                status: 'INITIATED',
                amountVnd: order.totalAmountVnd,
                paymentUrl: instructions.qrImageUrl,
            },
            select: { id: true, amountVnd: true },
        });

        return {
            paymentId: payment.id,
            providerReference,
            amountVnd: payment.amountVnd,
            expiresAt: order.expiresAt,
            transferInstructions: instructions,
        };
    }

    async handleSepayWebhook(_input: WebhookInput): Promise<void> {
        throw new Error('Not implemented');
    }
}
