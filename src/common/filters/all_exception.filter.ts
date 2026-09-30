import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

const CODES: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'VALIDATION_ERROR',
  429: 'TOO_MANY_REQUESTS',
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    let status = 500;
    let message: any = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse() as any;
      message = body.message ?? body;
    } else {
      this.logger.error(exception);
    }

    const error: any = { code: CODES[status] ?? 'INTERNAL_ERROR', message };

    if (Array.isArray(message)) {
      error.message = 'Invalid request data';
      error.details = message.map((m: string) => ({
        field: m.split(' ')[0],
        message: m,
      }));
    }

    res.status(status).json({ success: false, error });
  }
}
