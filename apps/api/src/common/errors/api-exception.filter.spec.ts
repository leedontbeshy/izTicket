import { HttpException } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { jest } from '@jest/globals';
import type { Request, Response } from 'express';
import type { ApiErrorResponse } from './api-error-response';
import { ApiExceptionFilter } from './api-exception.filter';
import { ErrorCode } from './error-code';

interface ResponseMock {
    status: jest.Mock<(statusCode: number) => ResponseMock>;
    json: jest.Mock<(body: ApiErrorResponse) => ResponseMock>;
}

describe('ApiExceptionFilter', () => {
    it('maps 429 errors to the standard too-many-requests code', () => {
        const filter = new ApiExceptionFilter();
        const response = createResponseMock();

        filter.catch(
            new HttpException('Too many requests.', 429),
            createHost(response),
        );

        expect(response.status).toHaveBeenCalledWith(429);
        expect(response.json).toHaveBeenCalledWith({
            statusCode: 429,
            error: 'Too Many Requests',
            message: 'Too many requests.',
            code: ErrorCode.TooManyRequests,
            details: null,
        });
    });
});

function createResponseMock() {
    const response = {} as ResponseMock;

    response.status = jest.fn<(statusCode: number) => ResponseMock>(
        () => response,
    );
    response.json = jest.fn<(body: ApiErrorResponse) => ResponseMock>(
        () => response,
    );

    return response;
}

function createHost(response: ResponseMock) {
    const request = {
        method: 'POST',
        originalUrl: '/api/v1/auth/login',
    };

    return {
        switchToHttp: () => ({
            getResponse: () => response as unknown as Response,
            getRequest: () => request as Request,
        }),
    } as unknown as ArgumentsHost;
}
