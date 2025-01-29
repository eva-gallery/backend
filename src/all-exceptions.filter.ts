import {ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {

  private logger = new Logger(AllExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      // Handle HTTP exceptions (e.g., BadRequestException, NotFoundException)
      const status = exception.getStatus();
      const message = exception.getResponse();
      response.status(status).json({
        statusCode: status,
        message,
      });
    } else {
      // Handle system errors and unexpected exceptions
      this.logger.error('Unhandled Exception:', exception);

      response.status(500).json({
        statusCode: 500,
        message: 'Internal server error',
      });
    }
  }
}
