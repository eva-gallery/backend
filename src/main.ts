import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { Request as ExpressRequest } from 'express';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AppConfigService } from '@modules/config';
import { isLocalhostOrigin } from '@common/helpers';
import { useContainer } from 'class-validator';
import { AllExceptionsFilter } from './all-exceptions.filter';

async function bootstrap() {
  const logger = new Logger('main')

  const app = await NestFactory.create(AppModule);

  // global error handler for errors in requests
  app.useGlobalFilters(new AllExceptionsFilter());

  // handle all other uncaught errors by logging
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection:', reason);
  });

  const config = app.get(AppConfigService);
  app.enableCors((req: ExpressRequest, callback) => {
    const opt: CorsOptions = {
      origin: false,
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      preflightContinue: false,
      optionsSuccessStatus: 204,
      credentials: true,
    };
    const origin = req.header('Origin');
    if ((config.allowLocalhostRequests && isLocalhostOrigin(req)) || config.frontendUrl === origin) {
      opt.origin = origin;
    }
    callback(null, opt);
  });
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe());
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  await app.listen(config.port);
}
bootstrap();