import { Employee } from '../entities/Employee';

declare global {
  namespace Express {
    interface Request {
      user?: Employee;
    }
  }
}

export {}; 