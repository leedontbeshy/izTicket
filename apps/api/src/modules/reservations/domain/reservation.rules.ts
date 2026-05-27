import { AppException } from '../../../common/errors/app.exception';

export function isSaleActive(ticketType: {
    saleStartsAt: Date;
    saleEndsAt: Date;
}) {
    const now = Date.now();
    return ticketType.saleStartsAt.getTime() <= now && ticketType.saleEndsAt.getTime() > now;
}

export function validateMaxPerOrder(ticketType: {
    maxPerOrder: number | null;
}, quantity: number) {
    if (ticketType.maxPerOrder !== null && quantity > ticketType.maxPerOrder) {
        throw AppException.conflict('Requested quantity exceeds maxPerOrder for ticket type.');
    }
}
