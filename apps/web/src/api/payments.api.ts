import { apiGet, apiPost } from './client';

export type PaymentStatus =
    | 'INITIATED'
    | 'SUCCEEDED'
    | 'FAILED'
    | 'REQUIRES_REVIEW';

export type SepayTransferInstructions = {
    bankName: string;
    accountNumber: string;
    transferContent: string;
    amountVnd: number;
    qrImageUrl: string;
};

export type SepayPayment = {
    paymentId: string;
    orderId: string;
    status: PaymentStatus;
    provider: 'SEPAY';
    paymentUrl: string;
    amount: number;
    providerReference: string;
    amountVnd: number;
    expiresAt: string;
    transferInstructions: SepayTransferInstructions;
};

export function createSepayPayment(orderId: string) {
    return apiPost<SepayPayment>('/payments/sepay/create', { orderId });
}

export function getPayment(paymentId: string) {
    return apiGet<SepayPayment>(`/payments/${paymentId}`);
}
