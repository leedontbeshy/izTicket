import { Injectable } from '@nestjs/common';
import { AppException } from '../../common/errors/app.exception';
import {
    createPage,
    getPaginationParams,
} from '../../common/pagination/pagination.helper';
import type { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateOrderDto } from './dto/create-order.dto';

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

            await tx.reservation.update({
                where: { id: reservation.id },
                data: { status: 'CONFIRMED', confirmedAt: new Date() },
            });

            return tx.order.findUnique({
                where: { id: order.id },
                select: orderSelect,
            });
        });

        return result;
    }

    async getOrder(customerId: string, orderId: string) {
        const order = await this.prismaService.order.findUnique({
            where: { id: orderId },
            select: orderSelect,
        });

        if (!order) {
            throw AppException.notFound('Order was not found.');
        }

        if (order.customerId !== customerId) {
            throw AppException.forbidden(
                'You do not have permission to view this order.',
            );
        }

        return order;
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

        return createPage(orders, totalItems, pagination);
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

        return createPage(orders, totalItems, pagination);
    }
}
