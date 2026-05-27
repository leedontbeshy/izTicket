import { Injectable } from '@nestjs/common';
import { AppException } from '../../common/errors/app.exception';
import { EventStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateTicketTypeDto } from './dto/create-ticket-type.dto';
import type { UpdateTicketTypeDto } from './dto/update-ticket-type.dto';
import {
    getAdjustedAvailableQuantity,
    hasValidSaleWindow,
} from './domain/ticket-type.rules';

const organizerTicketTypeSelect = {
    id: true,
    name: true,
    description: true,
    priceVnd: true,
    totalQuantity: true,
    availableQuantity: true,
    soldQuantity: true,
    maxPerOrder: true,
    saleStartsAt: true,
    saleEndsAt: true,
    createdAt: true,
    updatedAt: true,
} as const;

@Injectable()
export class TicketTypesService {
    constructor(private readonly prismaService: PrismaService) {}

    async listOrganizerTicketTypes(organizerId: string, eventId: string) {
        await this.findOwnedEvent(organizerId, eventId);

        const ticketTypes = await this.prismaService.ticketType.findMany({
            where: { eventId },
            select: organizerTicketTypeSelect,
            orderBy: { priceVnd: 'asc' },
        });

        return {
            items: ticketTypes.map(toOrganizerTicketTypeResponse),
        };
    }

    async createOrganizerTicketType(
        organizerId: string,
        eventId: string,
        dto: CreateTicketTypeDto,
    ) {
        const event = await this.findOwnedEvent(organizerId, eventId);
        ensureTicketTypesCanBeConfigured(event.status);
        validateSaleWindow(dto.saleStartsAt, dto.saleEndsAt);

        const ticketType = await this.prismaService.ticketType.create({
            data: {
                eventId,
                name: dto.name.trim(),
                description: dto.description?.trim(),
                priceVnd: dto.price,
                totalQuantity: dto.totalQuantity,
                availableQuantity: dto.totalQuantity,
                soldQuantity: 0,
                maxPerOrder: dto.maxPerOrder,
                saleStartsAt: new Date(dto.saleStartsAt),
                saleEndsAt: new Date(dto.saleEndsAt),
            },
            select: organizerTicketTypeSelect,
        });

        return toOrganizerTicketTypeResponse(ticketType);
    }

    async updateOrganizerTicketType(
        organizerId: string,
        ticketTypeId: string,
        dto: UpdateTicketTypeDto,
    ) {
        const ticketType = await this.findOwnedTicketType(
            organizerId,
            ticketTypeId,
        );
        ensureTicketTypesCanBeConfigured(ticketType.event.status);

        const saleStartsAt =
            dto.saleStartsAt ?? ticketType.saleStartsAt.toISOString();
        const saleEndsAt =
            dto.saleEndsAt ?? ticketType.saleEndsAt.toISOString();
        validateSaleWindow(saleStartsAt, saleEndsAt);

        const availableQuantity =
            dto.totalQuantity === undefined
                ? undefined
                : getAdjustedAvailableQuantity(
                      {
                          totalQuantity: ticketType.totalQuantity,
                          availableQuantity: ticketType.availableQuantity,
                      },
                      dto.totalQuantity,
                  );

        if (availableQuantity === null) {
            throw AppException.conflict(
                'Total quantity cannot be less than already sold or reserved quantity.',
            );
        }

        const updatedTicketType = await this.prismaService.ticketType.update({
            where: { id: ticketTypeId },
            data: {
                ...(dto.name ? { name: dto.name.trim() } : {}),
                ...(dto.description !== undefined
                    ? { description: dto.description.trim() }
                    : {}),
                ...(dto.price !== undefined ? { priceVnd: dto.price } : {}),
                ...(dto.totalQuantity !== undefined
                    ? {
                          totalQuantity: dto.totalQuantity,
                          availableQuantity,
                      }
                    : {}),
                ...(dto.maxPerOrder !== undefined
                    ? { maxPerOrder: dto.maxPerOrder }
                    : {}),
                ...(dto.saleStartsAt
                    ? { saleStartsAt: new Date(dto.saleStartsAt) }
                    : {}),
                ...(dto.saleEndsAt
                    ? { saleEndsAt: new Date(dto.saleEndsAt) }
                    : {}),
            },
            select: organizerTicketTypeSelect,
        });

        return toOrganizerTicketTypeResponse(updatedTicketType);
    }

    private async findOwnedEvent(organizerId: string, eventId: string) {
        const event = await this.prismaService.event.findFirst({
            where: {
                id: eventId,
                organizerId,
            },
            select: {
                id: true,
                status: true,
            },
        });

        if (!event) {
            throw AppException.notFound('Event was not found.');
        }

        return event;
    }

    private async findOwnedTicketType(
        organizerId: string,
        ticketTypeId: string,
    ) {
        const ticketType = await this.prismaService.ticketType.findFirst({
            where: {
                id: ticketTypeId,
                event: {
                    organizerId,
                },
            },
            select: {
                id: true,
                totalQuantity: true,
                availableQuantity: true,
                saleStartsAt: true,
                saleEndsAt: true,
                event: {
                    select: {
                        status: true,
                    },
                },
            },
        });

        if (!ticketType) {
            throw AppException.notFound('Ticket type was not found.');
        }

        return ticketType;
    }
}

function ensureTicketTypesCanBeConfigured(status: EventStatus) {
    if (status !== EventStatus.DRAFT && status !== EventStatus.REJECTED) {
        throw AppException.conflict(
            'Ticket types can only be configured for draft or rejected events.',
        );
    }
}

function validateSaleWindow(saleStartsAt: string, saleEndsAt: string) {
    if (!hasValidSaleWindow(new Date(saleStartsAt), new Date(saleEndsAt))) {
        throw AppException.conflict(
            'Ticket sale end time must be later than sale start time.',
        );
    }
}

function toOrganizerTicketTypeResponse(
    ticketType: Record<string, unknown> & { priceVnd: number },
) {
    const { priceVnd, ...response } = ticketType;

    return {
        ...response,
        price: priceVnd,
    };
}
