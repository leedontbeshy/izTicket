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
