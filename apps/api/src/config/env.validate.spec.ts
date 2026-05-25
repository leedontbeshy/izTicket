import { validateEnv } from './env.validate';

const validConfig = {
    NODE_ENV: 'production',
    PORT: '3000',
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/izticket',
    DIRECT_URL: '',
    CORS_ORIGIN: 'http://localhost:5173',
    JWT_SECRET: 'prod-secret-with-more-than-32-characters',
    JWT_ACCESS_TOKEN_EXPIRES_IN: '15m',
    JWT_REFRESH_TOKEN_EXPIRES_IN: '7d',
    JWT_ISSUER: 'izticket-api',
    JWT_AUDIENCE: 'izticket-web',
};

describe('validateEnv', () => {
    it('rejects placeholder JWT secrets in production', () => {
        expect(() =>
            validateEnv({
                ...validConfig,
                JWT_SECRET: 'replace-with-at-least-32-characters',
            }),
        ).toThrow();
    });

    it('accepts non-placeholder JWT secrets in production', () => {
        expect(validateEnv(validConfig).JWT_SECRET).toBe(
            validConfig.JWT_SECRET,
        );
    });
});
