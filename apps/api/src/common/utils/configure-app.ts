import { HttpStatus, ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { AppException } from '../errors/app.exception';
import { toValidationErrorDetails } from '../errors/validation-error-details';

export const API_PREFIX = 'api/v1';
const API_ROOT_PATH = `/${API_PREFIX}/`;

export function configureApp(app: INestApplication) {
    redirectRootToApiPrefix(app);
    app.setGlobalPrefix(API_PREFIX);
    app.useGlobalPipes(createValidationPipe());
}

function redirectRootToApiPrefix(app: INestApplication) {
    app.use((request: Request, response: Response, next: NextFunction) => {
        if (request.method === 'GET' && request.path === '/') {
            response.redirect(HttpStatus.FOUND, API_ROOT_PATH);
            return;
        }

        next();
    });
}

export function createValidationPipe() {
    return new ValidationPipe({
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
        whitelist: true,
        forbidNonWhitelisted: true,
        errorHttpStatusCode: HttpStatus.BAD_REQUEST,
        exceptionFactory: (errors) =>
            AppException.validationFailed(toValidationErrorDetails(errors)),
    });
}
