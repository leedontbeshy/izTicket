import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ExpiryService {
    constructor(private readonly prismaService: PrismaService) {}

    async processExpired(): Promise<{
        reservationsExpired: number;
        ordersExpired: number;
    }> {
        const now = new Date();
        const reservationsExpired = await this.expireReservations(now);
        const ordersExpired = await this.expireOrders(now);
        return { reservationsExpired, ordersExpired };
    }

    private async expireReservations(now: Date): Promise<number> {
        const candidates = await this.prismaService.reservation.findMany({
            where: { status: 'ACTIVE', expiresAt: { lt: now } },
            select: {
                id: true,
                items: {
                    select: { ticketTypeId: true, quantity: true },
                },
            },
        });

        let count = 0;

        for (const reservation of candidates) {
            await this.prismaService.$transaction(async (tx) => {
                const result = await tx.reservation.updateMany({
                    where: { id: reservation.id, status: 'ACTIVE' },
                    data: { status: 'EXPIRED' },
                });

                if (result.count === 0) return;

                for (const item of reservation.items) {
                    await tx.ticketType.update({
                        where: { id: item.ticketTypeId },
                        data: { availableQuantity: { increment: item.quantity } },
                    });
                }

                count++;
            });
        }

        return count;
    }

    private async expireOrders(now: Date): Promise<number> {
        const candidates = await this.prismaService.order.findMany({
            where: { status: 'PENDING_PAYMENT', expiresAt: { lt: now } },
            select: {
                id: true,
                items: {
                    select: { ticketTypeId: true, quantity: true },
                },
            },
        });

        let count = 0;

        for (const order of candidates) {
            await this.prismaService.$transaction(async (tx) => {
                const result = await tx.order.updateMany({
                    where: { id: order.id, status: 'PENDING_PAYMENT' },
                    data: { status: 'EXPIRED' },
                });

                if (result.count === 0) return;

                for (const item of order.items) {
                    await tx.ticketType.update({
                        where: { id: item.ticketTypeId },
                        data: { availableQuantity: { increment: item.quantity } },
                    });
                }

                count++;
            });
        }

        return count;
    }
}
