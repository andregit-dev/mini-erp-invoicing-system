import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';

@Injectable()
export class CookieMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (
      req.originalUrl?.startsWith('/api/docs') ||
      req.originalUrl?.startsWith('/sw.js')
    ) {
      return next();
    }

    cookieParser()(req, res, next);
  }
}
