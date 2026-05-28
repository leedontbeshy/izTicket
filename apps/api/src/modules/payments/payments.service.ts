import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppException } from '../../common/errors/app.exception';
import { DomainEventBus } from '../../common/events/domain-event-bus';
import { PrismaService } from '../../prisma/prisma.service';
import type { PaymentSucceededEvent } from './events/payment-succeeded.event';
import { SEPAY_PROVIDER } from './sepay/sepay-config';
import { SepayPaymentReferenceService } from './sepay/sepay-payment-reference.service';
import { SepayQrService } from './sepay/sepay-qr.service';
import { SepayWebhookVerifierService } from './sepay/sepay-webhook-verifier.service';
import {
    mapSepayWebhookPayload,
    sepayWebhookPayloadSchema,
} from './sepay/sepay-webhook.mapper';

type WebhookInput = {
    headers: Record<string, string | string[] | undefined>;
    rawBody: Buffer;
    body: unknown;
};

@Injectable()
export class PaymentsService {
    private readonly bankAccountNumber: string | undefined;

    constructor(
        private readonly prismaService: PrismaService,
        private readonly referenceService: SepayPaymentReferenceService,
        private readonly qrService: SepayQrService,
        private readonly webhookVerifierService: SepayWebhookVerifierService,
        private readonly configService: ConfigService,
        private readonly eventBus: DomainEventBus,
    ) {
        this.bankAccountNumber = configService.get<string>(
            'SEPAY_BANK_ACCOUNT_NUMBER',
        );
    }

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

    async handleSepayWebhook(input: WebhookInput): Promise<void> {
        if (!this.webhookVerifierService.verify(input.headers, input.rawBody)) {
            throw AppException.unauthorized('Webhook signature invalid.');
        }

        const parsed = sepayWebhookPayloadSchema.safeParse(input.body);
        if (!parsed.success) return;

        const cmd = mapSepayWebhookPayload(parsed.data);

        const alreadyProcessed = await this.prismaService.paymentEvent.findFirst(
            {
                where: {
                    provider: SEPAY_PROVIDER,
                    providerEventId: cmd.providerEventId,
                    processedAt: { not: null },
                },
                select: { id: true },
            },
        );
        if (alreadyProcessed) return;

        if (!cmd.providerReference) {
            await this.prismaService.paymentEvent.create({
                data: {
                    provider: SEPAY_PROVIDER,
                    providerEventId: cmd.providerEventId,
                    providerTransactionId: cmd.providerTransactionId,
                    eventType: 'WEBHOOK_UNKNOWN',
                    payload: parsed.data,
                    processedAt: new Date(),
                },
            });
            return;
        }

        const payment = await this.prismaService.payment.findFirst({
            where: {
                provider: SEPAY_PROVIDER,
                providerReference: cmd.providerReference,
            },
            select: { id: true, orderId: true, amountVnd: true },
        });

        if (!payment) {
            await this.prismaService.paymentEvent.create({
                data: {
                    provider: SEPAY_PROVIDER,
                    providerEventId: cmd.providerEventId,
                    providerTransactionId: cmd.providerTransactionId,
                    eventType: 'WEBHOOK_UNKNOWN',
                    payload: parsed.data,
                    processedAt: new Date(),
                },
            });
            return;
        }

        if (
            cmd.transferType !== 'in' ||
            cmd.accountNumber !== this.bankAccountNumber ||
            cmd.transferAmount < payment.amountVnd
        ) {
            await this.prismaService.paymentEvent.create({
                data: {
                    paymentId: payment.id,
                    provider: SEPAY_PROVIDER,
                    providerEventId: cmd.providerEventId,
                    providerTransactionId: cmd.providerTransactionId,
                    eventType: 'WEBHOOK_IGNORED',
                    payload: parsed.data,
                    processedAt: new Date(),
                },
            });
            return;
        }

        const order = await this.prismaService.order.findUnique({
            where: { id: payment.orderId },
            select: { status: true, expiresAt: true },
        });

        if (!order || order.status === 'PAID') return;

        if (order.status === 'CANCELLED' || order.status === 'PAYMENT_REVIEW') {
            await this.prismaService.paymentEvent.create({
                data: {
                    paymentId: payment.id,
                    provider: SEPAY_PROVIDER,
                    providerEventId: cmd.providerEventId,
                    providerTransactionId: cmd.providerTransactionId,
                    eventType: 'WEBHOOK_IGNORED',
                    payload: parsed.data,
                    processedAt: new Date(),
                },
            });
            return;
        }

        const now = new Date();
        const isLate =
            order.status === 'EXPIRED' || now >= order.expiresAt;

        await this.prismaService.$transaction(async (tx) => {
            if (!isLate) {
                await tx.payment.update({
                    where: { id: payment.id },
                    data: { status: 'SUCCEEDED', succeededAt: now },
                });
                await tx.order.update({
                    where: { id: payment.orderId },
                    data: { status: 'PAID', paidAt: now },
                });
            } else {
                await tx.payment.update({
                    where: { id: payment.id },
                    data: { status: 'REQUIRES_REVIEW' },
                });
                await tx.order.update({
                    where: { id: payment.orderId },
                    data: { status: 'PAYMENT_REVIEW' },
                });
            }

            await tx.paymentEvent.create({
                data: {
                    paymentId: payment.id,
                    provider: SEPAY_PROVIDER,
                    providerEventId: cmd.providerEventId,
                    providerTransactionId: cmd.providerTransactionId,
                    eventType: isLate ? 'LATE_PAYMENT' : 'PAYMENT_SUCCESS',
                    payload: parsed.data,
                    processedAt: now,
                },
            });
        });

        if (!isLate) {
            const event: PaymentSucceededEvent = {
                name: 'payment.succeeded',
                occurredAt: now,
                payload: {
                    orderId: payment.orderId,
                    paymentId: payment.id,
                    amountVnd: payment.amountVnd,
                },
            };
            await this.eventBus.publish(event);
        }
    }
}
