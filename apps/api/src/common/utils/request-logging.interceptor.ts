import {
    CallHandler,
    ExecutionContext,
    HttpException,
    HttpStatus,
    Injectable,
    Logger,
    NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { catchError, tap, throwError } from 'rxjs';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('HTTP');

    intercept(context: ExecutionContext, next: CallHandler) {
        const http = context.switchToHttp();
        const request = http.getRequest<Request>();
        const response = http.getResponse<Response>();
        const startedAt = Date.now();

        return next.handle().pipe(
            tap(() => {
                this.logger.log(
                    this.formatLogLine(
                        request,
                        response.statusCode,
                        Date.now() - startedAt,
                    ),
                );
            }),
            catchError((error: unknown) => {
                const statusCode =
                    error instanceof HttpException
                        ? error.getStatus()
                        : HttpStatus.INTERNAL_SERVER_ERROR;

                this.logger.warn(
                    this.formatLogLine(
                        request,
                        statusCode,
                        Date.now() - startedAt,
                    ),
                );

                return throwError(() => error);
            }),
        );
    }

    private formatLogLine(
        request: Request,
        statusCode: number,
        durationMs: number,
    ) {
        return `${request.method} ${request.originalUrl} ${statusCode} ${durationMs}ms`;
    }
}
