import { z } from 'zod';

export const sepayWebhookPayloadSchema = z.object({
    id: z.number().int(),
    gateway: z.string().optional(),
    transactionDate: z.string().optional(),
    accountNumber: z.string(),
    subAccount: z.string().optional(),
    code: z.string().optional(),
    content: z.string().optional(),
    transferType: z.string(),
    description: z.string().optional(),
    transferAmount: z.number(),
    accumulated: z.number().optional(),
    referenceCode: z.string().optional(),
});

export type SepayWebhookPayload = z.infer<typeof sepayWebhookPayloadSchema>;

export type SepayWebhookCommand = {
    providerEventId: string;
    providerTransactionId: string | undefined;
    providerReference: string | undefined;
    transferType: string;
    transferAmount: number;
    accountNumber: string;
};

export function mapSepayWebhookPayload(
    payload: SepayWebhookPayload,
): SepayWebhookCommand {
    return {
        providerEventId: String(payload.id),
        providerTransactionId: payload.referenceCode,
        providerReference: payload.code,
        transferType: payload.transferType,
        transferAmount: payload.transferAmount,
        accountNumber: payload.accountNumber,
    };
}

export const sepayPgIpnSchema = z.object({
    notification_type: z.string(),
    order: z.object({
        id: z.string(),
        order_invoice_number: z.string().optional(),
        order_amount: z.number(),
    }),
    transaction: z.object({
        transaction_id: z.string().optional(),
        transaction_status: z.string(),
        transaction_amount: z.number(),
    }),
});

export type SepayPgIpnPayload = z.infer<typeof sepayPgIpnSchema>;
