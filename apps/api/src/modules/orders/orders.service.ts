import { Injectable } from '@nestjs/common';
import { AppException } from '../../common/errors/app.exception';
import {
    createPage,
    getPaginationParams,
} from '../../common/pagination/pagination.helper';
import type { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateOrderDto } from './dto/create-order.dto';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../generated/prisma/enums';

const orderSelect = {
    id: true,
    eventId: true,
    customerId: true,
    reservationId: true,
    status: true,
    totalAmountVnd: true,
    expiresAt: true,
    paidAt: true,
    cancelledAt: true,
    createdAt: true,
    event: {
        select: {
            organizerId: true,
        },
    },
    items: {
        select: {
            id: true,
            ticketTypeId: true,
            quantity: true,
            unitPriceVnd: true,
            subtotalVnd: true,
        },
    },
} as const;

const organizerOrderSelect = {
    id: true,
    status: true,
    totalAmountVnd: true,
    expiresAt: true,
    paidAt: true,
    cancelledAt: true,
    createdAt: true,
    customer: {
        select: {
            id: true,
            name: true,
            email: true,
        },
    },
    items: {
        select: {
            id: true,
            ticketTypeId: true,
            quantity: true,
            unitPriceVnd: true,
            subtotalVnd: true,
        },
    },
} as const;

@Injectable()
export class OrdersService {
    constructor(private readonly prismaService: PrismaService) {}

    async createOrder(customerId: string, dto: CreateOrderDto) {
        const reservation = await this.prismaService.reservation.findUnique({
            where: { id: dto.reservationId },
            select: {
                id: true,
                customerId: true,
                eventId: true,
                status: true,
                expiresAt: true,
                items: {
                    select: {
                        ticketTypeId: true,
                        quantity: true,
                        unitPriceVnd: true,
                        subtotalVnd: true,
                    },
                },
            },
        });

        if (!reservation) {
            throw AppException.notFound('Reservation was not found.');
        }

        if (reservation.customerId !== customerId) {
            throw AppException.forbidden(
                'You do not have permission to order for this reservation.',
            );
        }

        if (reservation.status !== 'ACTIVE') {
            throw AppException.conflict('Reservation is not active.');
        }

        if (new Date() >= reservation.expiresAt) {
            throw AppException.conflict('Reservation has expired.');
        }

        const existingOrder = await this.prismaService.order.findUnique({
            where: { reservationId: dto.reservationId },
            select: { id: true },
        });

        if (existingOrder) {
            throw AppException.conflict(
                'An order already exists for this reservation.',
            );
        }

        const totalAmountVnd = reservation.items.reduce(
            (sum, item) => sum + item.subtotalVnd,
            0,
        );

        const result = await this.prismaService.$transaction(async (tx) => {
            const order = await tx.order.create({
                data: {
                    customerId,
                    eventId: reservation.eventId,
                    reservationId: reservation.id,
                    status: 'PENDING_PAYMENT',
                    totalAmountVnd,
                    expiresAt: reservation.expiresAt,
                },
            });

            for (const item of reservation.items) {
                await tx.orderItem.create({
                    data: {
                        orderId: order.id,
                        ticketTypeId: item.ticketTypeId,
                        quantity: item.quantity,
                        unitPriceVnd: item.unitPriceVnd,
                        subtotalVnd: item.subtotalVnd,
                    },
                });
            }

            return tx.order.findUnique({
                where: { id: order.id },
                select: orderSelect,
            });
        });

        return result ? toOrderResponse(result) : result;
    }

    async getOrder(user: AuthenticatedUser, orderId: string) {
        const order = await this.prismaService.order.findUnique({
            where: { id: orderId },
            select: orderSelect,
        });

        if (!order) {
            throw AppException.notFound('Order was not found.');
        }

        if (!canViewOrder(user, order)) {
            throw AppException.forbidden(
                'You do not have permission to view this order.',
            );
        }

        return toOrderResponse(order);
    }

    async listMyOrders(customerId: string, query: PaginationQueryDto) {
        const pagination = getPaginationParams(query);
        const where = { customerId };

        const [orders, totalItems] = await Promise.all([
            this.prismaService.order.findMany({
                where,
                select: orderSelect,
                orderBy: { createdAt: 'desc' },
                skip: pagination.skip,
                take: pagination.take,
            }),
            this.prismaService.order.count({ where }),
        ]);

        return createPage(orders.map(toOrderResponse), totalItems, pagination);
    }

    async listEventOrders(
        organizerId: string,
        eventId: string,
        query: PaginationQueryDto,
    ) {
        const event = await this.prismaService.event.findFirst({
            where: { id: eventId, organizerId },
            select: { id: true },
        });

        if (!event) {
            throw AppException.notFound('Event was not found.');
        }

        const pagination = getPaginationParams(query);
        const where = { eventId };

        const [orders, totalItems] = await Promise.all([
            this.prismaService.order.findMany({
                where,
                select: organizerOrderSelect,
                orderBy: { createdAt: 'desc' },
                skip: pagination.skip,
                take: pagination.take,
            }),
            this.prismaService.order.count({ where }),
        ]);

        return createPage(
            orders.map((order) => ({
                ...order,
                customerName: order.customer.name,
                totalAmount: order.totalAmountVnd,
            })),
            totalItems,
            pagination,
        );
    }
}

function canViewOrder(
    user: AuthenticatedUser,
    order: {
        customerId: string;
        event: { organizerId: string };
    },
) {
    if (user.role === UserRole.ADMIN) return true;
    if (user.role === UserRole.CUSTOMER) return order.customerId === user.id;
    if (user.role === UserRole.ORGANIZER) {
        return order.event.organizerId === user.id;
    }
    return false;
}

function toOrderResponse(order: {
    id: string;
    eventId: string;
    customerId: string;
    reservationId: string;
    status: string;
    totalAmountVnd: number;
    expiresAt: Date;
    paidAt: Date | null;
    cancelledAt: Date | null;
    createdAt: Date;
    items: Array<{
        id: string;
        ticketTypeId: string;
        quantity: number;
        unitPriceVnd: number;
        subtotalVnd: number;
    }>;
}) {
    return {
        id: order.id,
        eventId: order.eventId,
        customerId: order.customerId,
        reservationId: order.reservationId,
        status: order.status,
        totalAmountVnd: order.totalAmountVnd,
        totalAmount: order.totalAmountVnd,
        expiresAt: order.expiresAt,
        paidAt: order.paidAt,
        cancelledAt: order.cancelledAt,
        createdAt: order.createdAt,
        items: order.items.map((item) => ({
            ...item,
            unitPrice: item.unitPriceVnd,
            subtotal: item.subtotalVnd,
        })),
    };
}
