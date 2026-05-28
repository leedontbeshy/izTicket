import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './modules/health/health.module';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.validate';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { EventsModule } from './modules/events/events.module';
import { AdminReviewModule } from './modules/admin-review/admin-review.module';
import { TicketTypesModule } from './modules/ticket-types/ticket-types.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ExpiryModule } from './modules/expiry/expiry.module';
import { PaymentsModule } from './modules/payments/payments.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['apps/api/.env', '.env'],
            validate: validateEnv,
        }),
        ThrottlerModule.forRoot([
            {
                ttl: 60_000,
                limit: 100,
            },
        ]),
        CommonModule,
        HealthModule,
        AuthModule,
        EventsModule,
        AdminReviewModule,
        TicketTypesModule,
        ReservationsModule,
        OrdersModule,
        ExpiryModule,
        PaymentsModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule {}
