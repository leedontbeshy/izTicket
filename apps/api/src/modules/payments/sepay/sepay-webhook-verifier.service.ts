import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import {
    SEPAY_HMAC_SIGNATURE_HEADER,
    SEPAY_HMAC_TIMESTAMP_HEADER,
    SEPAY_HMAC_TOLERANCE_SECONDS,
} from './sepay-config';

type IncomingHeaders = Record<string, string | string[] | undefined>;

@Injectable()
export class SepayWebhookVerifierService {
    private readonly authMode: 'hmac' | 'apikey';
    private readonly secret: string | undefined;
    private readonly apiKey: string | undefined;

    constructor(configService: ConfigService) {
        this.authMode =
            (configService.get<string>('SEPAY_WEBHOOK_AUTH_MODE') ??
                'apikey') as 'hmac' | 'apikey';
        this.secret = configService.get<string>('SEPAY_WEBHOOK_SECRET');
        this.apiKey = configService.get<string>('SEPAY_WEBHOOK_API_KEY');
    }

    verify(headers: IncomingHeaders, rawBody: Buffer): boolean {
        if (this.authMode === 'hmac') {
            return this.verifyHmac(headers, rawBody);
        }
        return this.verifyApiKey(headers);
    }

    private verifyHmac(headers: IncomingHeaders, rawBody: Buffer): boolean {
        if (!this.secret) return false;

        const timestamp = this.getHeader(headers, SEPAY_HMAC_TIMESTAMP_HEADER);
        const signature = this.getHeader(headers, SEPAY_HMAC_SIGNATURE_HEADER);

        if (!timestamp || !signature) return false;

        const timestampMs = Number(timestamp) * 1000;
        if (!Number.isFinite(timestampMs)) return false;

        const ageSeconds = Math.abs(Date.now() - timestampMs) / 1000;
        if (ageSeconds > SEPAY_HMAC_TOLERANCE_SECONDS) return false;

        const expected = `sha256=${createHmac('sha256', this.secret)
            .update(`${timestamp}.${rawBody.toString('utf8')}`)
            .digest('hex')}`;

        const expectedBuf = Buffer.from(expected);
        const actualBuf = Buffer.from(signature);

        return (
            expectedBuf.length === actualBuf.length &&
            timingSafeEqual(expectedBuf, actualBuf)
        );
    }

    private verifyApiKey(headers: IncomingHeaders): boolean {
        if (!this.apiKey) return false;

        const authHeader = this.getHeader(headers, 'authorization');
        if (!authHeader) return false;

        const expected = `Apikey ${this.apiKey}`;
        if (expected.length !== authHeader.length) return false;

        return timingSafeEqual(
            Buffer.from(expected),
            Buffer.from(authHeader),
        );
    }

    private getHeader(
        headers: IncomingHeaders,
        name: string,
    ): string | undefined {
        const value = headers[name.toLowerCase()];
        if (Array.isArray(value)) return value[0];
        return value;
    }
}
