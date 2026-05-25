import { HttpException, HttpStatus } from '@nestjs/common';
import type { ApiErrorResponse } from './api-error-response';
import { ErrorCode } from './error-code';

interface AppExceptionOptions {
    statusCode: HttpStatus;
    error: string;
    message: string;
    code: string;
    details?: unknown;
}

export class AppException extends HttpException {
    constructor(options: AppExceptionOptions) {
        const response: ApiErrorResponse = {
            statusCode: options.statusCode,
            error: options.error,
            message: options.message,
            code: options.code,
            details: options.details ?? null,
        };

        super(response, options.statusCode);
    }

    static forbidden(message = 'Forbidden') {
        return new AppException({
            statusCode: HttpStatus.FORBIDDEN,
            error: 'Forbidden',
            message,
            code: ErrorCode.Forbidden,
        });
    }

    static unauthorized(message = 'Unauthorized') {
        return new AppException({
            statusCode: HttpStatus.UNAUTHORIZED,
            error: 'Unauthorized',
            message,
            code: ErrorCode.Unauthorized,
        });
    }

    static conflict(message = 'Conflict') {
        return new AppException({
            statusCode: HttpStatus.CONFLICT,
            error: 'Conflict',
            message,
            code: ErrorCode.Conflict,
        });
    }

    static notFound(message = 'Not Found') {
        return new AppException({
            statusCode: HttpStatus.NOT_FOUND,
            error: 'Not Found',
            message,
            code: ErrorCode.NotFound,
        });
    }

    static validationFailed(details: unknown) {
        return new AppException({
            statusCode: HttpStatus.BAD_REQUEST,
            error: 'Bad Request',
            message: 'Validation failed',
            code: ErrorCode.ValidationFailed,
            details,
        });
    }
}
