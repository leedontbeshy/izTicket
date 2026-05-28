import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import {
    SEPAY_PAYMENT_CODE_SUFFIX_LENGTH,
    SEPAY_QR_ALPHABET,
} from './sepay-config';

@Injectable()
export class SepayPaymentReferenceService {
    private readonly prefix: string;

    constructor(configService: ConfigService) {
        this.prefix =
            configService.get<string>('SEPAY_PAYMENT_CODE_PREFIX') ?? 'IZT';
    }

    generate(): string {
        const bytes = randomBytes(SEPAY_PAYMENT_CODE_SUFFIX_LENGTH);
        const suffix = Array.from(bytes)
            .map((b) => SEPAY_QR_ALPHABET[b % SEPAY_QR_ALPHABET.length])
            .join('');
        return `${this.prefix}${suffix}`;
    }
}
