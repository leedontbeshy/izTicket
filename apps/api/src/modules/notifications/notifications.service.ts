import {
    Injectable,
    Logger,
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';
import { DomainEventBus } from '../../common/events/domain-event-bus';
import { NotificationStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import type {
    EventApproved,
    EventRejected,
} from '../events/domain/event-domain.events';
import type { TicketIssuedEvent } from '../tickets/events/ticket-issued.event';

const LOG_CHANNEL = 'LOG';

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(NotificationsService.name);
    private readonly unsubscribers: Array<() => void> = [];

    constructor(
        private readonly prismaService: PrismaService,
        private readonly domainEventBus: DomainEventBus,
    ) {}

    onModuleInit() {
        this.unsubscribers.push(
            this.domainEventBus.subscribe(
                'EventApproved',
                (event: EventApproved) =>
                    this.logEventApproved(event).catch((error: unknown) =>
                        this.logHandlerError(event.name, error),
                    ),
            ),
            this.domainEventBus.subscribe(
                'EventRejected',
                (event: EventRejected) =>
                    this.logEventRejected(event).catch((error: unknown) =>
                        this.logHandlerError(event.name, error),
                    ),
            ),
            this.domainEventBus.subscribe(
                'ticket.issued',
                (event: TicketIssuedEvent) =>
                    this.logTicketIssued(event).catch((error: unknown) =>
                        this.logHandlerError(event.name, error),
                    ),
            ),
        );
    }

    onModuleDestroy() {
        for (const unsubscribe of this.unsubscribers) {
            unsubscribe();
        }
    }

    private async logEventApproved(event: EventApproved) {
        const reviewedEvent = await this.findEventForNotification(
            event.payload.eventId,
        );

        if (!reviewedEvent) {
            return;
        }

        await this.prismaService.notificationLog.create({
            data: {
                userId: reviewedEvent.organizerId,
                type: 'EVENT_APPROVED',
                channel: LOG_CHANNEL,
                status: NotificationStatus.SENT,
                recipient: reviewedEvent.organizer.email,
                sentAt: new Date(),
                payload: {
                    eventId: reviewedEvent.id,
                    title: reviewedEvent.title,
                    reviewerId: event.payload.reviewerId,
                    decision: 'APPROVED',
                },
            },
        });
    }

    private async logEventRejected(event: EventRejected) {
        const reviewedEvent = await this.findEventForNotification(
            event.payload.eventId,
        );

        if (!reviewedEvent) {
            return;
        }

        await this.prismaService.notificationLog.create({
            data: {
                userId: reviewedEvent.organizerId,
                type: 'EVENT_REJECTED',
                channel: LOG_CHANNEL,
                status: NotificationStatus.SENT,
                recipient: reviewedEvent.organizer.email,
                sentAt: new Date(),
                payload: {
                    eventId: reviewedEvent.id,
                    title: reviewedEvent.title,
                    reviewerId: event.payload.reviewerId,
                    decision: 'REJECTED',
                    reason: event.payload.reason,
                },
            },
        });
    }

    private async logTicketIssued(event: TicketIssuedEvent) {
        const ticket = await this.prismaService.ticket.findUnique({
            where: { id: event.payload.ticketId },
            select: {
                id: true,
                ticketCode: true,
                orderId: true,
                customerId: true,
                eventId: true,
                customer: {
                    select: {
                        email: true,
                    },
                },
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
            },
        });

        if (!ticket) {
            return;
        }

        await this.prismaService.notificationLog.create({
            data: {
                userId: ticket.customerId,
                orderId: ticket.orderId,
                ticketId: ticket.id,
                type: 'TICKET_ISSUED',
                channel: LOG_CHANNEL,
                status: NotificationStatus.SENT,
                recipient: ticket.customer.email,
                sentAt: new Date(),
                payload: {
                    eventId: ticket.eventId,
                    eventTitle: ticket.event.title,
                    ticketTypeName: ticket.ticketType.name,
                    ticketCode: ticket.ticketCode,
                },
            },
        });
    }

    private findEventForNotification(eventId: string) {
        return this.prismaService.event.findUnique({
            where: { id: eventId },
            select: {
                id: true,
                organizerId: true,
                title: true,
                organizer: {
                    select: {
                        email: true,
                    },
                },
            },
        });
    }

    private logHandlerError(eventName: string, error: unknown) {
        if (error instanceof Error) {
            this.logger.error(
                `Failed to write notification log for ${eventName}.`,
                error.stack,
            );
            return;
        }

        this.logger.error(
            `Failed to write notification log for ${eventName}: ${String(error)}`,
        );
    }
}
