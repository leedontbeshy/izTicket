export const SEPAY_PROVIDER = 'SEPAY';
export const SEPAY_PAYMENT_CODE_SUFFIX_LENGTH = 8;
export const SEPAY_QR_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

// These header names must be verified against actual SePay test webhook delivery logs.
export const SEPAY_HMAC_TIMESTAMP_HEADER = 'x-sepay-timestamp';
export const SEPAY_HMAC_SIGNATURE_HEADER = 'x-sepay-signature';
export const SEPAY_HMAC_TOLERANCE_SECONDS = 300;
