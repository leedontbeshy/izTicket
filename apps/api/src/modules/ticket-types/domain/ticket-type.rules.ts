export function hasValidSaleWindow(saleStartsAt: Date, saleEndsAt: Date) {
    return saleEndsAt.getTime() > saleStartsAt.getTime();
}

export interface TicketInventory {
    totalQuantity: number;
    availableQuantity: number;
}

export function getAdjustedAvailableQuantity(
    inventory: TicketInventory,
    nextTotalQuantity: number,
) {
    const unavailableQuantity =
        inventory.totalQuantity - inventory.availableQuantity;

    if (nextTotalQuantity < unavailableQuantity) {
        return null;
    }

    return nextTotalQuantity - unavailableQuantity;
}
