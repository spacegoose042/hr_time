import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';
import { ApiError } from './errorHandler';

export const validateRequest = (schema: AnyZodObject) => 
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      next(new ApiError('Validation failed', 400, error.errors));
    }
  }; 