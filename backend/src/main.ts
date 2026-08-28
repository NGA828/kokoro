import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });

  // CORS — allow the configured frontend origin(s).
  const origins = (process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim());
  app.enableCors({
    origin: origins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.setGlobalPrefix('api', { exclude: ['media/(.*)'] });

  const port = parseInt(process.env.PORT || '4000', 10);
  await app.listen(port, '0.0.0.0');
  const logger = new Logger('KokoroMarch');
  logger.log(`❤️  Kokoro March API running on http://0.0.0.0:${port}/api`);
}

bootstrap();
