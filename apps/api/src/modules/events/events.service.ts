import { Injectable } from '@nestjs/common';
import { AppException } from '../../common/errors/app.exception';
import { DomainEventBus } from '../../common/events/domain-event-bus';
import {
    getPaginationParams,
    type PaginationParams,
} from '../../common/pagination/pagination.helper';
import type { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';
import { EventStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateEventDto } from './dto/create-event.dto';
import type { ListPublicEventsQueryDto } from './dto/list-public-events-query.dto';
import type { UpdateEventDto } from './dto/update-event.dto';
import { eventSubmitted } from './domain/event-domain.events';
import { canEditEvent, canSubmitEvent } from './domain/event-state.rules';

const publicEventListSelect = {
    id: true,
    title: true,
    slug: true,
    status: true,
    startsAt: true,
    thumbnailUrl: true,
    venue: {
        select: {
            name: true,
            city: true,
        },
    },
    ticketTypes: {
        select: {
            priceVnd: true,
        },
        orderBy: {
            priceVnd: 'asc' as const,
        },
        take: 1,
    },
} as const;

const organizerEventSelect = {
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
    venue: {
        select: {
            name: true,
            address: true,
            city: true,
            district: true,
            mapUrl: true,
        },
    },
} as const;

@Injectable()
export class EventsService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly domainEventBus: DomainEventBus,
    ) {}

    async listPublicEvents(query: ListPublicEventsQueryDto) {
        const pagination = getPaginationParams(query);
        const where = {
            status: EventStatus.PUBLISHED,
            ...(query.q
                ? {
                      title: {
                          contains: query.q.trim(),
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(query.city
                ? {
                      venue: {
                          city: {
                              contains: query.city.trim(),
                              mode: 'insensitive' as const,
                          },
                      },
                  }
                : {}),
            ...(query.category
                ? {
                      category: {
                          equals: query.category.trim(),
                          mode: 'insensitive' as const,
                      },
                  }
                : {}),
            ...(query.from || query.to
                ? {
                      startsAt: {
                          ...(query.from ? { gte: new Date(query.from) } : {}),
                          ...(query.to ? { lte: new Date(query.to) } : {}),
                      },
                  }
                : {}),
        };

        const [events, total] = await Promise.all([
            this.prismaService.event.findMany({
                where,
                select: publicEventListSelect,
                orderBy: { startsAt: 'asc' },
                skip: pagination.skip,
                take: pagination.take,
            }),
            this.prismaService.event.count({ where }),
        ]);

        return {
            items: events.map((event) => ({
                id: event.id,
                title: event.title,
                slug: event.slug,
                status: event.status,
                venueName: event.venue.name,
                city: event.venue.city,
                startsAt: event.startsAt,
                minPrice: event.ticketTypes[0]?.priceVnd ?? null,
                thumbnailUrl: event.thumbnailUrl,
            })),
            page: pagination.page,
            limit: pagination.limit,
            total,
        };
    }

    async getPublicEvent(eventId: string) {
        const event = await this.prismaService.event.findFirst({
            where: {
                id: eventId,
                status: EventStatus.PUBLISHED,
            },
            select: {
                id: true,
                title: true,
                description: true,
                status: true,
                thumbnailUrl: true,
                startsAt: true,
                endsAt: true,
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
                        availableQuantity: true,
                        saleStartsAt: true,
                        saleEndsAt: true,
                    },
                    orderBy: { priceVnd: 'asc' },
                },
            },
        });

        if (!event) {
            throw AppException.notFound('Event was not found.');
        }

        return {
            ...event,
            ticketTypes: event.ticketTypes.map(
                ({ priceVnd, ...ticketType }) => ({
                    ...ticketType,
                    price: priceVnd,
                }),
            ),
        };
    }

    async listOrganizerEvents(organizerId: string, query: PaginationQueryDto) {
        const pagination = getPaginationParams(query);
        const where = { organizerId };
        const [events, total] = await Promise.all([
            this.prismaService.event.findMany({
                where,
                select: organizerEventSelect,
                orderBy: { createdAt: 'desc' },
                skip: pagination.skip,
                take: pagination.take,
            }),
            this.prismaService.event.count({ where }),
        ]);

        return toPageResponse(events, total, pagination);
    }

    async getOrganizerEvent(organizerId: string, eventId: string) {
        const event = await this.prismaService.event.findFirst({
            where: {
                id: eventId,
                organizerId,
            },
            select: organizerEventSelect,
        });

        if (!event) {
            throw AppException.notFound('Event was not found.');
        }

        return event;
    }

    async createOrganizerEvent(organizerId: string, dto: CreateEventDto) {
        validateEventDates(dto.startsAt, dto.endsAt);
        const slug = await this.createUniqueSlug(dto.title);

        return this.prismaService.event.create({
            data: {
                title: dto.title.trim(),
                slug,
                description: dto.description.trim(),
                category: dto.category.trim(),
                startsAt: new Date(dto.startsAt),
                endsAt: new Date(dto.endsAt),
                thumbnailUrl: dto.thumbnailUrl,
                organizer: {
                    connect: { id: organizerId },
                },
                venue: {
                    create: {
                        name: dto.venue.name.trim(),
                        address: dto.venue.address.trim(),
                        city: dto.venue.city.trim(),
                        district: dto.venue.district?.trim(),
                        mapUrl: dto.venue.mapUrl,
                    },
                },
            },
            select: {
                id: true,
                status: true,
            },
        });
    }

    async updateOrganizerEvent(
        organizerId: string,
        eventId: string,
        dto: UpdateEventDto,
    ) {
        const existingEvent = await this.findOrganizerEvent(
            organizerId,
            eventId,
        );
        if (!canEditEvent(existingEvent.status)) {
            throw AppException.conflict(
                'Only draft or rejected events can be edited.',
            );
        }

        const startsAt = dto.startsAt ?? existingEvent.startsAt.toISOString();
        const endsAt = dto.endsAt ?? existingEvent.endsAt.toISOString();
        validateEventDates(startsAt, endsAt);

        return this.prismaService.event.update({
            where: { id: eventId },
            data: {
                ...(dto.title
                    ? {
                          title: dto.title.trim(),
                          slug: await this.createUniqueSlug(dto.title, eventId),
                      }
                    : {}),
                ...(dto.description
                    ? { description: dto.description.trim() }
                    : {}),
                ...(dto.category ? { category: dto.category.trim() } : {}),
                ...(dto.startsAt ? { startsAt: new Date(dto.startsAt) } : {}),
                ...(dto.endsAt ? { endsAt: new Date(dto.endsAt) } : {}),
                ...(dto.thumbnailUrl !== undefined
                    ? { thumbnailUrl: dto.thumbnailUrl }
                    : {}),
                ...(dto.venue
                    ? {
                          venue: {
                              update: {
                                  name: dto.venue.name.trim(),
                                  address: dto.venue.address.trim(),
                                  city: dto.venue.city.trim(),
                                  district: dto.venue.district?.trim(),
                                  mapUrl: dto.venue.mapUrl,
                              },
                          },
                      }
                    : {}),
            },
            select: organizerEventSelect,
        });
    }

    async submitOrganizerEvent(organizerId: string, eventId: string) {
        const event = await this.findOrganizerEvent(organizerId, eventId);

        if (!canSubmitEvent(event.status)) {
            throw AppException.conflict(
                'Only draft or rejected events can be submitted for review.',
            );
        }

        const submittedEvent = await this.prismaService.event.update({
            where: { id: eventId },
            data: {
                status: EventStatus.PENDING_REVIEW,
                submittedAt: new Date(),
            },
            select: {
                id: true,
                status: true,
            },
        });

        await this.domainEventBus.publish(
            eventSubmitted({
                eventId,
                organizerId,
            }),
        );

        return submittedEvent;
    }

    private async findOrganizerEvent(organizerId: string, eventId: string) {
        const event = await this.prismaService.event.findFirst({
            where: {
                id: eventId,
                organizerId,
            },
            select: {
                id: true,
                status: true,
                startsAt: true,
                endsAt: true,
            },
        });

        if (!event) {
            throw AppException.notFound('Event was not found.');
        }

        return event;
    }

    private async createUniqueSlug(title: string, currentEventId?: string) {
        const baseSlug = slugify(title) || 'event';
        let suffix = 1;
        let slug = baseSlug;

        while (
            await this.prismaService.event.findFirst({
                where: {
                    slug,
                    ...(currentEventId ? { id: { not: currentEventId } } : {}),
                },
                select: { id: true },
            })
        ) {
            suffix += 1;
            slug = `${baseSlug}-${suffix}`;
        }

        return slug;
    }
}

function validateEventDates(startsAt: string, endsAt: string) {
    if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
        throw AppException.conflict(
            'Event end time must be later than start time.',
        );
    }
}

function slugify(title: string) {
    return title
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function toPageResponse<T>(
    items: T[],
    total: number,
    pagination: Pick<PaginationParams, 'page' | 'limit'>,
) {
    return {
        items,
        page: pagination.page,
        limit: pagination.limit,
        total,
    };
}
