import { Injectable } from '@nestjs/common';
import { AppException } from '../../common/errors/app.exception';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateReservationDto } from './dto/create-reservation.dto';
import { isSaleActive, validateMaxPerOrder } from './domain/reservation.rules';
import { EventStatus } from '../../generated/prisma/enums';

const reservationSelect = {
    id: true,
    eventId: true,
    customerId: true,
    status: true,
    expiresAt: true,
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

@Injectable()
export class ReservationsService {
    constructor(private readonly prismaService: PrismaService) {}

    async createReservation(customerId: string, dto: CreateReservationDto) {
        const event = await this.prismaService.event.findUnique({
            where: { id: dto.eventId },
            select: { id: true, status: true },
        });

        if (!event || event.status !== EventStatus.PUBLISHED) {
            throw AppException.conflict(
                'Event is not available for reservations.',
            );
        }

        const ticketTypeIds = dto.items.map((i) => i.ticketTypeId);
        const ticketTypes = await this.prismaService.ticketType.findMany({
            where: { id: { in: ticketTypeIds } },
            select: {
                id: true,
                availableQuantity: true,
                priceVnd: true,
                saleStartsAt: true,
                saleEndsAt: true,
                maxPerOrder: true,
                eventId: true,
            },
        });

        if (ticketTypes.length !== ticketTypeIds.length) {
            throw AppException.notFound('One or more ticket types not found.');
        }

        for (const item of dto.items) {
            const tt = ticketTypes.find((t) => t.id === item.ticketTypeId)!;
            if (tt.eventId !== dto.eventId) {
                throw AppException.conflict(
                    'Ticket type does not belong to event.',
                );
            }

            if (
                !isSaleActive({
                    saleStartsAt: tt.saleStartsAt,
                    saleEndsAt: tt.saleEndsAt,
                })
            ) {
                throw AppException.conflict(
                    'Ticket sale window is not active.',
                );
            }

            validateMaxPerOrder({ maxPerOrder: tt.maxPerOrder }, item.quantity);
        }

        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        const result = await this.prismaService.$transaction(async (tx) => {
            for (const item of dto.items) {
                const updateResult = await tx.ticketType.updateMany({
                    where: {
                        id: item.ticketTypeId,
                        availableQuantity: { gte: item.quantity },
                    },
                    data: {
                        availableQuantity: { decrement: item.quantity },
                    },
                });

                if (updateResult.count !== 1) {
                    throw AppException.conflict(
                        'Not enough tickets available.',
                    );
                }
            }

            const reservation = await tx.reservation.create({
                data: {
                    customerId,
                    eventId: dto.eventId,
                    status: 'ACTIVE',
                    expiresAt,
                },
            });

            for (const item of dto.items) {
                const tt = ticketTypes.find((t) => t.id === item.ticketTypeId)!;

                await tx.reservationItem.create({
                    data: {
                        reservationId: reservation.id,
                        ticketTypeId: item.ticketTypeId,
                        quantity: item.quantity,
                        unitPriceVnd: tt.priceVnd,
                        subtotalVnd: tt.priceVnd * item.quantity,
                    },
                });
            }

            return tx.reservation.findUnique({
                where: { id: reservation.id },
                select: reservationSelect,
            });
        });

        return result ? toReservationResponse(result) : result;
    }

    async getReservation(customerId: string, reservationId: string) {
        const reservation = await this.prismaService.reservation.findUnique({
            where: { id: reservationId },
            select: reservationSelect,
        });

        if (!reservation) {
            throw AppException.notFound('Reservation was not found.');
        }

        if (reservation.customerId !== customerId) {
            throw AppException.forbidden(
                'You do not have permission to view this reservation.',
            );
        }

        return toReservationResponse(reservation);
    }

    async cancelReservation(customerId: string, reservationId: string) {
        const reservation = await this.prismaService.reservation.findUnique({
            where: { id: reservationId },
            select: {
                id: true,
                customerId: true,
                status: true,
            },
        });

        if (!reservation) {
            throw AppException.notFound('Reservation was not found.');
        }

        if (reservation.customerId !== customerId) {
            throw AppException.forbidden(
                'You do not have permission to cancel this reservation.',
            );
        }

        if (reservation.status !== 'ACTIVE') {
            throw AppException.conflict(
                'Only active reservations can be cancelled.',
            );
        }

        const result = await this.prismaService.$transaction(async (tx) => {
            const items = await tx.reservationItem.findMany({
                where: { reservationId: reservationId },
                select: { ticketTypeId: true, quantity: true },
            });

            for (const item of items) {
                await tx.ticketType.update({
                    where: { id: item.ticketTypeId },
                    data: { availableQuantity: { increment: item.quantity } },
                });
            }

            return tx.reservation.update({
                where: { id: reservationId },
                data: { status: 'CANCELLED', cancelledAt: new Date() },
                select: reservationSelect,
            });
        });

        return toReservationResponse(result);
    }
}

function toReservationResponse(reservation: {
    id: string;
    eventId: string;
    customerId: string;
    status: string;
    expiresAt: Date;
    createdAt: Date;
    items: Array<{
        id: string;
        ticketTypeId: string;
        quantity: number;
        unitPriceVnd: number;
        subtotalVnd: number;
    }>;
}) {
    const items = reservation.items.map((item) => ({
        ...item,
        unitPrice: item.unitPriceVnd,
        subtotal: item.subtotalVnd,
    }));

    return {
        ...reservation,
        items,
        totalAmount: items.reduce((sum, item) => sum + item.subtotal, 0),
    };
}
