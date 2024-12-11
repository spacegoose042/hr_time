import { Request, Response, NextFunction } from 'express';

export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public errors?: any[]
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const errorHandler = (error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      status: 'error',
      message: error.message,
      errors: error.errors
    });
  }

  return res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
}; 