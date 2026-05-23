import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ApiErrorResponse } from './api-error-response';
import { ErrorCode } from './error-code';

const StatusCode = {
    BadRequest: 400,
    Unauthorized: 401,
    Forbidden: 403,
    NotFound: 404,
    Conflict: 409,
    InternalServerError: 500,
} as const;

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(ApiExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const context = host.switchToHttp();
        const response = context.getResponse<Response>();
        const request = context.getRequest<Request>();
        const statusCode =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;
        const errorResponse = this.toErrorResponse(exception, statusCode);

        if (statusCode >= StatusCode.InternalServerError) {
            this.logger.error(
                `${request.method} ${request.originalUrl} failed`,
                exception instanceof Error ? exception.stack : undefined,
            );
        }

        response.status(statusCode).json(errorResponse);
    }

    private toErrorResponse(
        exception: unknown,
        statusCode: number,
    ): ApiErrorResponse {
        if (exception instanceof HttpException) {
            const response = exception.getResponse();

            if (isApiErrorResponse(response)) {
                return {
                    ...response,
                    details: response.details ?? null,
                };
            }

            if (isRecord(response)) {
                return {
                    statusCode,
                    error: getStringValue(
                        response.error,
                        defaultError(statusCode),
                    ),
                    message: getMessage(response.message),
                    code: defaultCode(statusCode),
                    details: response.details ?? null,
                };
            }

            return {
                statusCode,
                error: defaultError(statusCode),
                message:
                    typeof response === 'string' ? response : exception.message,
                code: defaultCode(statusCode),
                details: null,
            };
        }

        return {
            statusCode,
            error: 'Internal Server Error',
            message: 'Internal server error',
            code: ErrorCode.InternalServerError,
            details: null,
        };
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
    return (
        isRecord(value) &&
        typeof value.statusCode === 'number' &&
        typeof value.error === 'string' &&
        typeof value.message === 'string' &&
        typeof value.code === 'string'
    );
}

function getStringValue(value: unknown, fallback: string) {
    return typeof value === 'string' ? value : fallback;
}

function getMessage(value: unknown) {
    if (Array.isArray(value)) {
        return value.join(', ');
    }

    return typeof value === 'string' ? value : 'Request failed';
}

function defaultError(statusCode: number) {
    switch (statusCode) {
        case StatusCode.BadRequest:
            return 'Bad Request';
        case StatusCode.Unauthorized:
            return 'Unauthorized';
        case StatusCode.Forbidden:
            return 'Forbidden';
        case StatusCode.NotFound:
            return 'Not Found';
        case StatusCode.Conflict:
            return 'Conflict';
        default:
            return statusCode >= StatusCode.InternalServerError
                ? 'Internal Server Error'
                : 'Request Error';
    }
}

function defaultCode(statusCode: number) {
    switch (statusCode) {
        case StatusCode.BadRequest:
            return ErrorCode.BadRequest;
        case StatusCode.Unauthorized:
            return ErrorCode.Unauthorized;
        case StatusCode.Forbidden:
            return ErrorCode.Forbidden;
        case StatusCode.NotFound:
            return ErrorCode.NotFound;
        case StatusCode.Conflict:
            return ErrorCode.Conflict;
        default:
            return statusCode >= StatusCode.InternalServerError
                ? ErrorCode.InternalServerError
                : 'REQUEST_FAILED';
    }
}
