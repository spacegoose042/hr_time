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
  console.error('Error details:', {
    name: error.name,
    message: error.message,
    stack: error.stack
  });

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      status: 'error',
      message: error.message,
      errors: error.errors
    });
  }

  return res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
}; 