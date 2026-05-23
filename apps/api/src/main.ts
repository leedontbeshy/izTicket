import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { configureApp } from './common/utils/configure-app';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);

    configureApp(app);
    app.enableCors({
        origin:
            configService.get<string>('CORS_ORIGIN') ?? 'http://localhost:5173',
        credentials: true,
    });

    await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
});
