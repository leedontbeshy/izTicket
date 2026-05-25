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

const envSchema = z.object({
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
});

export type AppEnv = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): AppEnv {
    return envSchema.parse(config);
}
