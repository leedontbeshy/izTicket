import type { DomainEvent } from '../../../common/events/domain-event';

export type PaymentSucceededPayload = {
    orderId: string;
    paymentId: string;
    amountVnd: number;
};

export type PaymentSucceededEvent = DomainEvent<PaymentSucceededPayload> & {
    name: 'payment.succeeded';
};
