import { z } from 'zod';

const emptyStringToUndefined = (value: unknown) =>
    value === '' ? undefined : value;
const optionalString = z.preprocess(
    emptyStringToUndefined,
    z.string().min(1).optional(),
);
const urlWithDefault = (defaultValue: string) =>
    z.preprocess(
        emptyStringToUndefined,
        z.string().url().default(defaultValue),
    );
const durationWithDefault = (defaultValue: string) =>
    z.preprocess(
        emptyStringToUndefined,
        z
            .string()
            .regex(/^\d+(ms|s|m|h|d|w|y)$/)
            .default(defaultValue),
    );

const jwtSecretPlaceholderPatterns = [
    /replace/i,
    /change[-_ ]?me/i,
    /example/i,
    /placeholder/i,
    /your[-_ ]?jwt/i,
    /your[-_ ]?secret/i,
];

const envSchema = z
    .object({
        NODE_ENV: z
            .enum(['development', 'test', 'production'])
            .default('development'),
        PORT: z.coerce.number().int().positive().default(3000),
        DATABASE_URL: z.string().min(1),
        DIRECT_URL: optionalString,
        CORS_ORIGIN: urlWithDefault('http://localhost:5173'),
        JWT_SECRET: z.string().min(32),
        JWT_ACCESS_TOKEN_EXPIRES_IN: durationWithDefault('15m'),
        JWT_REFRESH_TOKEN_EXPIRES_IN: durationWithDefault('7d'),
        JWT_ISSUER: z.preprocess(
            emptyStringToUndefined,
            z.string().min(1).default('izticket-api'),
        ),
        JWT_AUDIENCE: z.preprocess(
            emptyStringToUndefined,
            z.string().min(1).default('izticket-web'),
        ),
        SEPAY_BANK_NAME: z.preprocess(
            emptyStringToUndefined,
            z.string().min(1).default('Vietcombank'),
        ),
        SEPAY_BANK_CODE: optionalString,
        SEPAY_BANK_ACCOUNT_NUMBER: optionalString,
        SEPAY_PAYMENT_CODE_PREFIX: z.preprocess(
            emptyStringToUndefined,
            z.string().min(1).default('IZT'),
        ),
        SEPAY_QR_BASE_URL: urlWithDefault('https://qr.sepay.vn/img'),
        SEPAY_WEBHOOK_AUTH_MODE: z.preprocess(
            emptyStringToUndefined,
            z.enum(['hmac', 'apikey', 'pg']).default('apikey'),
        ),
        SEPAY_WEBHOOK_SECRET: optionalString,
        SEPAY_WEBHOOK_API_KEY: optionalString,
    })
    .superRefine((env, context) => {
        if (
            env.NODE_ENV === 'production' &&
            jwtSecretPlaceholderPatterns.some((pattern) =>
                pattern.test(env.JWT_SECRET),
            )
        ) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['JWT_SECRET'],
                message: 'JWT_SECRET must not be a placeholder in production.',
            });
        }
    });

export type AppEnv = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): AppEnv {
    return envSchema.parse(config);
}
