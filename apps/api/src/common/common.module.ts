import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { DomainEventsModule } from './events/domain-events.module';
import { ApiExceptionFilter } from './errors/api-exception.filter';
import { RequestLoggingInterceptor } from './utils/request-logging.interceptor';

@Module({
    imports: [DomainEventsModule],
    providers: [
        {
            provide: APP_FILTER,
            useClass: ApiExceptionFilter,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: RequestLoggingInterceptor,
        },
    ],
    exports: [DomainEventsModule],
})
export class CommonModule {}
