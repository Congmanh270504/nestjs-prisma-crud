import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const logger = new Logger('HTTP');

    // HTTP Request Logger: Ghi log mọi request (GET, POST, PUT, DELETE) lên terminal / MS HOST
    app.use((req: any, res: any, next: any) => {
        const { method, originalUrl } = req;
        const start = Date.now();
        res.on('finish', () => {
            const { statusCode } = res;
            const duration = Date.now() - start;
            logger.log(`${method} ${originalUrl} ${statusCode} +${duration}ms`);
        });
        next();
    });

    // CORS: Cho phép NextJS / React frontend gọi API
    app.enableCors({
        origin: [
            process.env.CORS_ORIGIN || 'http://localhost:3000',
            'http://localhost:3000',
            'http://localhost:5173',
        ],
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        credentials: true,
    });

    // Validation pipe global
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

    const port = process.env.PORT || 3002;
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 NestJS server is running on: http://0.0.0.0:${port}`);
}
bootstrap();
