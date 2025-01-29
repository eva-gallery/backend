import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { Request as ExpressRequest } from 'express';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AppConfigService } from '@modules/config';
import { isLocalhostOrigin } from '@common/helpers';
import { useContainer } from 'class-validator';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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