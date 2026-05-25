export const ErrorCode = {
    BadRequest: 'BAD_REQUEST',
    ValidationFailed: 'VALIDATION_FAILED',
    Unauthorized: 'UNAUTHORIZED',
    Forbidden: 'FORBIDDEN',
    NotFound: 'NOT_FOUND',
    Conflict: 'CONFLICT',
    TooManyRequests: 'TOO_MANY_REQUESTS',
    InternalServerError: 'INTERNAL_SERVER_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
