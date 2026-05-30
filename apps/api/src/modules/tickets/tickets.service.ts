import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { AppException } from '../../common/errors/app.exception';
import { DomainEventBus } from '../../common/events/domain-event-bus';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { OrderStatus, UserRole } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import type { PaymentSucceededEvent } from '../payments/events/payment-succeeded.event';
import { ticketIssued } from './events/ticket-issued.event';
import type { TicketIssuedEvent } from './events/ticket-issued.event';

const ticketListSelect = {
    id: true,
    status: true,
    issuedAt: true,
    qrPayload: true,
    event: {
        select: {
            title: true,
        },
    },
    ticketType: {
        select: {
            name: true,
        },
    },
} as const;

const ticketDetailSelect = {
    id: true,
    orderId: true,
    customerId: true,
    eventId: true,
    ticketCode: true,
    qrPayload: true,
    status: true,
    issuedAt: true,
    voidedAt: true,
    event: {
        select: {
            title: true,
            startsAt: true,
            endsAt: true,
            organizerId: true,
            venue: {
                select: {
                    name: true,
                    address: true,
                    city: true,
                },
            },
        },
    },
    ticketType: {
        select: {
            name: true,
            description: true,
        },
    },
} as const;

@Injectable()
export class TicketsService implements OnModuleInit, OnModuleDestroy {
    private unsubscribePaymentSucceeded?: () => void;

    constructor(
        private readonly prismaService: PrismaService,
        private readonly domainEventBus: DomainEventBus,
    ) {}

    onModuleInit() {
        this.unsubscribePaymentSucceeded = this.domainEventBus.subscribe(
            'payment.succeeded',
            (event: PaymentSucceededEvent) =>
                this.issueTicketsForPaidOrder(event.payload.orderId),
        );
    }

    onModuleDestroy() {
        this.unsubscribePaymentSucceeded?.();
    }

    async listCustomerTickets(customerId: string) {
        const tickets = await this.prismaService.ticket.findMany({
            where: { customerId },
            select: ticketListSelect,
            orderBy: { issuedAt: 'desc' },
        });

        return {
            items: tickets.map((ticket) => ({
                id: ticket.id,
                eventTitle: ticket.event.title,
                ticketTypeName: ticket.ticketType.name,
                status: ticket.status,
                issuedAt: ticket.issuedAt,
                qrPayload: ticket.qrPayload,
            })),
        };
    }

    async getTicket(user: AuthenticatedUser, ticketId: string) {
        const ticket = await this.prismaService.ticket.findUnique({
            where: { id: ticketId },
            select: ticketDetailSelect,
        });

        if (!ticket) {
            throw AppException.notFound('Ticket was not found.');
        }

        if (!canViewTicket(user, ticket)) {
            throw AppException.forbidden(
                'You do not have permission to view this ticket.',
            );
        }

        return toTicketDetailResponse(ticket);
    }

    async issueTicketsForPaidOrder(orderId: string): Promise<void> {
        const order = await this.prismaService.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                customerId: true,
                eventId: true,
                status: true,
                items: {
                    select: {
                        id: true,
                        ticketTypeId: true,
                        quantity: true,
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!order || order.status !== OrderStatus.PAID) {
            return;
        }

        const issuedTicketEvents = await this.prismaService.$transaction(
            async (tx) => {
                const eventsToPublish: TicketIssuedEvent[] = [];

                for (const item of order.items) {
                    const existingTicketCount = await tx.ticket.count({
                        where: {
                            orderItemId: item.id,
                        },
                    });
                    const missingQuantity = item.quantity - existingTicketCount;

                    if (missingQuantity <= 0) {
                        continue;
                    }

                    for (
                        let sequence = existingTicketCount + 1;
                        sequence <= item.quantity;
                        sequence += 1
                    ) {
                        const ticketCode = buildTicketCode(
                            order.id,
                            item.id,
                            sequence,
                        );
                        const ticket = await tx.ticket.create({
                            data: {
                                orderId: order.id,
                                orderItemId: item.id,
                                ticketTypeId: item.ticketTypeId,
                                customerId: order.customerId,
                                eventId: order.eventId,
                                ticketCode,
                                qrPayload: buildQrPayload(ticketCode),
                            },
                            select: {
                                id: true,
                                orderId: true,
                                customerId: true,
                                eventId: true,
                            },
                        });

                        eventsToPublish.push(
                            ticketIssued({
                                ticketId: ticket.id,
                                orderId: ticket.orderId,
                                customerId: ticket.customerId,
                                eventId: ticket.eventId,
                            }),
                        );
                    }

                    await tx.ticketType.update({
                        where: { id: item.ticketTypeId },
                        data: {
                            soldQuantity: { increment: missingQuantity },
                        },
                    });
                }

                return eventsToPublish;
            },
        );

        await this.domainEventBus.publishAll(issuedTicketEvents);
    }
}

function canViewTicket(
    user: AuthenticatedUser,
    ticket: {
        customerId: string;
        event: {
            organizerId: string;
        };
    },
) {
    if (user.role === UserRole.ADMIN) {
        return true;
    }

    if (user.role === UserRole.CUSTOMER) {
        return ticket.customerId === user.id;
    }

    if (user.role === UserRole.ORGANIZER) {
        return ticket.event.organizerId === user.id;
    }

    return false;
}

function toTicketDetailResponse(ticket: {
    id: string;
    orderId: string;
    eventId: string;
    ticketCode: string;
    qrPayload: string;
    status: string;
    issuedAt: Date;
    voidedAt: Date | null;
    event: {
        title: string;
        startsAt: Date;
        endsAt: Date;
        venue: {
            name: string;
            address: string;
            city: string;
        };
    };
    ticketType: {
        name: string;
        description: string | null;
    };
}) {
    return {
        id: ticket.id,
        orderId: ticket.orderId,
        eventId: ticket.eventId,
        eventTitle: ticket.event.title,
        ticketTypeName: ticket.ticketType.name,
        ticketTypeDescription: ticket.ticketType.description,
        ticketCode: ticket.ticketCode,
        qrPayload: ticket.qrPayload,
        status: ticket.status,
        issuedAt: ticket.issuedAt,
        voidedAt: ticket.voidedAt,
        eventStartsAt: ticket.event.startsAt,
        eventEndsAt: ticket.event.endsAt,
        venue: ticket.event.venue,
    };
}

function buildTicketCode(
    orderId: string,
    orderItemId: string,
    sequence: number,
) {
    return [
        'IZT',
        compactUuid(orderId).slice(0, 12),
        compactUuid(orderItemId).slice(0, 12),
        String(sequence).padStart(3, '0'),
    ].join('-');
}

function buildQrPayload(ticketCode: string) {
    return `izticket:${ticketCode}`;
}

function compactUuid(value: string) {
    return value.replace(/-/g, '').toUpperCase();
}
