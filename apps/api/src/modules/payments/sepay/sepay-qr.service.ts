import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type SepayTransferInstructions = {
    bankName: string;
    accountNumber: string;
    transferContent: string;
    amountVnd: number;
    qrImageUrl: string;
};

@Injectable()
export class SepayQrService {
    private readonly bankName: string;
    private readonly bankCode: string | undefined;
    private readonly accountNumber: string | undefined;
    private readonly qrBaseUrl: string;

    constructor(configService: ConfigService) {
        this.bankName =
            configService.get<string>('SEPAY_BANK_NAME') ?? 'Vietcombank';
        this.bankCode = configService.get<string>('SEPAY_BANK_CODE');
        this.accountNumber = configService.get<string>(
            'SEPAY_BANK_ACCOUNT_NUMBER',
        );
        this.qrBaseUrl =
            configService.get<string>('SEPAY_QR_BASE_URL') ??
            'https://qr.sepay.vn/img';
    }

    buildTransferInstructions(
        amountVnd: number,
        paymentCode: string,
    ): SepayTransferInstructions {
        if (!this.bankCode || !this.accountNumber) {
            throw new Error(
                'SePay bank config not set: SEPAY_BANK_CODE, SEPAY_BANK_ACCOUNT_NUMBER',
            );
        }

        const params = new URLSearchParams({
            acc: this.accountNumber,
            bank: this.bankCode,
            amount: String(amountVnd),
            des: paymentCode,
        });

        return {
            bankName: this.bankName,
            accountNumber: this.accountNumber,
            transferContent: paymentCode,
            amountVnd,
            qrImageUrl: `${this.qrBaseUrl}?${params.toString()}`,
        };
    }
}
