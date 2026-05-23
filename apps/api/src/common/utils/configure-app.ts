import { HttpStatus, ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { AppException } from '../errors/app.exception';
import { toValidationErrorDetails } from '../errors/validation-error-details';

export const API_PREFIX = 'api/v1';

export function configureApp(app: INestApplication) {
    app.setGlobalPrefix(API_PREFIX);
    app.useGlobalPipes(createValidationPipe());
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
