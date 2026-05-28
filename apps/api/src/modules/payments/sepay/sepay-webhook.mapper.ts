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
