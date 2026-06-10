import { Injectable } from '@nestjs/common';
import { AppException } from '../../common/errors/app.exception';
import { DomainEventBus } from '../../common/events/domain-event-bus';
import { getPaginationParams } from '../../common/pagination/pagination.helper';
import type { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';
import { EventStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import {
    eventApproved,
    eventRejected,
} from '../events/domain/event-domain.events';
import { canReviewEvent } from '../events/domain/event-state.rules';

const pendingEventSelect = {
    id: true,
    title: true,
    category: true,
    status: true,
    startsAt: true,
    submittedAt: true,
    organizer: {
        select: {
            id: true,
            name: true,
            email: true,
        },
    },
    venue: {
        select: {
            name: true,
            city: true,
        },
    },
} as const;

const adminEventDetailSelect = {
    id: true,
    title: true,
    slug: true,
    description: true,
    category: true,
    status: true,
    thumbnailUrl: true,
    startsAt: true,
    endsAt: true,
    submittedAt: true,
    publishedAt: true,
    createdAt: true,
    updatedAt: true,
    organizer: {
        select: {
            id: true,
            name: true,
            email: true,
        },
    },
    venue: {
        select: {
            name: true,
            address: true,
            city: true,
            district: true,
            mapUrl: true,
        },
    },
    ticketTypes: {
        select: {
            id: true,
            name: true,
            description: true,
            priceVnd: true,
            totalQuantity: true,
            availableQuantity: true,
            saleStartsAt: true,
            saleEndsAt: true,
        },
        orderBy: {
            priceVnd: 'asc' as const,
        },
    },
    reviews: {
        select: {
            id: true,
            decision: true,
            reason: true,
            createdAt: true,
            reviewer: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc' as const,
        },
    },
} as const;

@Injectable()
export class AdminReviewService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly domainEventBus: DomainEventBus,
    ) {}

    async listPendingEvents(query: PaginationQueryDto) {
        const pagination = getPaginationParams(query);
        const where = { status: EventStatus.PENDING_REVIEW };
        const [events, total] = await Promise.all([
            this.prismaService.event.findMany({
                where,
                select: pendingEventSelect,
                orderBy: { submittedAt: 'asc' },
                skip: pagination.skip,
                take: pagination.take,
            }),
            this.prismaService.event.count({ where }),
        ]);

        return {
            items: events,
            page: pagination.page,
            limit: pagination.limit,
            total,
        };
    }

    async getEventDetail(eventId: string) {
        const event = await this.prismaService.event.findUnique({
            where: { id: eventId },
            select: adminEventDetailSelect,
        });

        if (!event) {
            throw AppException.notFound('Event was not found.');
        }

        return event;
    }

    async approveEvent(adminId: string, eventId: string) {
        await this.recordDecision(adminId, eventId, 'APPROVED');
        await this.domainEventBus.publish(
            eventApproved({
                eventId,
                reviewerId: adminId,
            }),
        );

        return {
            id: eventId,
            status: EventStatus.PUBLISHED,
        };
    }

    async rejectEvent(adminId: string, eventId: string, reason: string) {
        const trimmedReason = reason.trim();

        if (!trimmedReason) {
            throw AppException.conflict('A rejection reason is required.');
        }

        await this.recordDecision(adminId, eventId, 'REJECTED', trimmedReason);
        await this.domainEventBus.publish(
            eventRejected({
                eventId,
                reviewerId: adminId,
                reason: trimmedReason,
            }),
        );

        return {
            id: eventId,
            status: EventStatus.REJECTED,
        };
    }

    private async recordDecision(
        adminId: string,
        eventId: string,
        decision: 'APPROVED' | 'REJECTED',
        reason?: string,
    ) {
        await this.prismaService.$transaction(async (transaction) => {
            const existingEvent = await transaction.event.findUnique({
                where: { id: eventId },
                select: { id: true, status: true },
            });

            if (!existingEvent) {
                throw AppException.notFound('Event was not found.');
            }

            if (!canReviewEvent(existingEvent.status)) {
                throw AppException.conflict(
                    'Only pending review events can be reviewed.',
                );
            }

            await transaction.eventReview.create({
                data: {
                    eventId,
                    reviewerId: adminId,
                    decision,
                    reason,
                },
            });
        });
    }
}
