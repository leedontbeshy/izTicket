import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppException } from '../../common/errors/app.exception';
import { DomainEventBus } from '../../common/events/domain-event-bus';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../generated/prisma/enums';
import type { PaymentSucceededEvent } from './events/payment-succeeded.event';
import { SEPAY_PROVIDER } from './sepay/sepay-config';
import { SepayPaymentReferenceService } from './sepay/sepay-payment-reference.service';
import { SepayQrService } from './sepay/sepay-qr.service';
import { SepayWebhookVerifierService } from './sepay/sepay-webhook-verifier.service';
import {
    mapSepayWebhookPayload,
    sepayPgIpnSchema,
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

    async createSepayPayment(
        customerId: string,
        orderId: string,
        returnUrl?: string,
    ) {
        const order = await this.prismaService.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                customerId: true,
                status: true,
                totalAmountVnd: true,
                expiresAt: true,
                reservation: { select: { status: true, expiresAt: true } },
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

        if (order.reservation.status !== 'ACTIVE') {
            throw AppException.conflict(
                'Reservation is not in a valid state for payment.',
            );
        }

        if (new Date() >= order.reservation.expiresAt) {
            throw AppException.conflict('Reservation has expired.');
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
            orderId,
            status: 'INITIATED',
            provider: SEPAY_PROVIDER,
            paymentUrl: instructions.qrImageUrl,
            amount: payment.amountVnd,
            providerReference,
            amountVnd: payment.amountVnd,
            expiresAt: order.expiresAt,
            returnUrl: returnUrl ?? null,
            transferInstructions: instructions,
        };
    }

    async getPayment(user: AuthenticatedUser, paymentId: string) {
        const payment = await this.prismaService.payment.findUnique({
            where: { id: paymentId },
            select: {
                id: true,
                orderId: true,
                provider: true,
                providerReference: true,
                providerTransactionId: true,
                status: true,
                amountVnd: true,
                paymentUrl: true,
                succeededAt: true,
                failedAt: true,
                createdAt: true,
                order: {
                    select: {
                        customerId: true,
                        event: {
                            select: {
                                organizerId: true,
                            },
                        },
                    },
                },
            },
        });

        if (!payment) {
            throw AppException.notFound('Payment was not found.');
        }

        if (!canViewPayment(user, payment)) {
            throw AppException.forbidden(
                'You do not have permission to view this payment.',
            );
        }

        return toPaymentResponse(payment);
    }

    async handleSepayWebhook(input: WebhookInput): Promise<void> {
        if (!this.webhookVerifierService.verify(input.headers, input.rawBody)) {
            throw AppException.unauthorized('Webhook signature invalid.');
        }

        const bodyObj = input.body as Record<string, unknown>;
        if (bodyObj?.notification_type !== undefined) {
            return this.handleSepayPgIpn(input.body);
        }

        const parsed = sepayWebhookPayloadSchema.safeParse(input.body);
        if (!parsed.success) return;

        const cmd = mapSepayWebhookPayload(parsed.data);

        const alreadyProcessed =
            await this.prismaService.paymentEvent.findFirst({
                where: {
                    provider: SEPAY_PROVIDER,
                    providerEventId: cmd.providerEventId,
                    processedAt: { not: null },
                },
                select: { id: true },
            });
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
            select: { status: true, expiresAt: true, reservationId: true },
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
        const isLate = order.status === 'EXPIRED' || now >= order.expiresAt;

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
                await tx.reservation.update({
                    where: { id: order.reservationId },
                    data: { status: 'CONFIRMED', confirmedAt: now },
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

    private async handleSepayPgIpn(body: unknown): Promise<void> {
        const parsed = sepayPgIpnSchema.safeParse(body);
        if (!parsed.success) return;

        const { notification_type, order, transaction } = parsed.data;
        if (notification_type !== 'PAYMENT_SUCCESS') return;
        if (transaction.transaction_status !== 'APPROVED') return;

        const providerEventId = order.id;
        const providerReference = order.order_invoice_number;
        const providerTransactionId = transaction.transaction_id;
        const transferAmount = transaction.transaction_amount;

        const alreadyProcessed =
            await this.prismaService.paymentEvent.findFirst({
                where: {
                    provider: SEPAY_PROVIDER,
                    providerEventId,
                    processedAt: { not: null },
                },
                select: { id: true },
            });
        if (alreadyProcessed) return;

        if (!providerReference) {
            await this.prismaService.paymentEvent.create({
                data: {
                    provider: SEPAY_PROVIDER,
                    providerEventId,
                    providerTransactionId,
                    eventType: 'WEBHOOK_UNKNOWN',
                    payload: parsed.data,
                    processedAt: new Date(),
                },
            });
            return;
        }

        const payment = await this.prismaService.payment.findFirst({
            where: { provider: SEPAY_PROVIDER, providerReference },
            select: { id: true, orderId: true, amountVnd: true },
        });

        if (!payment) {
            await this.prismaService.paymentEvent.create({
                data: {
                    provider: SEPAY_PROVIDER,
                    providerEventId,
                    providerTransactionId,
                    eventType: 'WEBHOOK_UNKNOWN',
                    payload: parsed.data,
                    processedAt: new Date(),
                },
            });
            return;
        }

        if (transferAmount < payment.amountVnd) {
            await this.prismaService.paymentEvent.create({
                data: {
                    paymentId: payment.id,
                    provider: SEPAY_PROVIDER,
                    providerEventId,
                    providerTransactionId,
                    eventType: 'WEBHOOK_IGNORED',
                    payload: parsed.data,
                    processedAt: new Date(),
                },
            });
            return;
        }

        const dbOrder = await this.prismaService.order.findUnique({
            where: { id: payment.orderId },
            select: { status: true, expiresAt: true, reservationId: true },
        });

        if (!dbOrder || dbOrder.status === 'PAID') return;

        if (
            dbOrder.status === 'CANCELLED' ||
            dbOrder.status === 'PAYMENT_REVIEW'
        ) {
            await this.prismaService.paymentEvent.create({
                data: {
                    paymentId: payment.id,
                    provider: SEPAY_PROVIDER,
                    providerEventId,
                    providerTransactionId,
                    eventType: 'WEBHOOK_IGNORED',
                    payload: parsed.data,
                    processedAt: new Date(),
                },
            });
            return;
        }

        const now = new Date();
        const isLate = dbOrder.status === 'EXPIRED' || now >= dbOrder.expiresAt;

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
                await tx.reservation.update({
                    where: { id: dbOrder.reservationId },
                    data: { status: 'CONFIRMED', confirmedAt: now },
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
                    providerEventId,
                    providerTransactionId,
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

function canViewPayment(
    user: AuthenticatedUser,
    payment: {
        order: {
            customerId: string;
            event: {
                organizerId: string;
            };
        };
    },
) {
    if (user.role === UserRole.ADMIN) return true;
    if (user.role === UserRole.CUSTOMER) {
        return payment.order.customerId === user.id;
    }
    if (user.role === UserRole.ORGANIZER) {
        return payment.order.event.organizerId === user.id;
    }
    return false;
}

function toPaymentResponse(payment: {
    id: string;
    orderId: string;
    provider: string;
    providerReference: string | null;
    providerTransactionId: string | null;
    status: string;
    amountVnd: number;
    paymentUrl: string | null;
    succeededAt: Date | null;
    failedAt: Date | null;
    createdAt: Date;
}) {
    return {
        paymentId: payment.id,
        id: payment.id,
        orderId: payment.orderId,
        provider: payment.provider,
        providerReference: payment.providerReference,
        providerTransactionId: payment.providerTransactionId,
        status: payment.status,
        amount: payment.amountVnd,
        amountVnd: payment.amountVnd,
        paymentUrl: payment.paymentUrl,
        succeededAt: payment.succeededAt,
        failedAt: payment.failedAt,
        createdAt: payment.createdAt,
    };
}
