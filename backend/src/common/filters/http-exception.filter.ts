import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any = null;

    // Handle HttpException (NestJS built-in)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message;
        errors = (exceptionResponse as any).errors || null;
      }
    }
    // Handle Prisma errors
    else if (exception instanceof Error) {
      // Prisma known request error
      if ('code' in exception && (exception as any).code) {
        const prismaError = exception as any;
        switch (prismaError.code) {
          case 'P2002':
            status = HttpStatus.CONFLICT;
            message = 'Duplicate entry: ' + (prismaError.meta?.target || '');
            break;
          case 'P2025':
            status = HttpStatus.NOT_FOUND;
            message = 'Record not found';
            break;
          case 'P2003':
            status = HttpStatus.BAD_REQUEST;
            message = 'Invalid foreign key reference';
            break;
          default:
            message = prismaError.message;
        }
      } else {
        message = exception.message;
      }
    }

    // Log error
    this.logger.error(
      `${request.method} ${request.url} ${status} - ${message}`,
      exception instanceof Error ? exception.stack : '',
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: message,
      errors: errors,
    });
  }
}
