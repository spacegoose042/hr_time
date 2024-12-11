import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Employee } from '../entities/Employee';
import AppDataSource from '../db/connection';
import { ApiError } from './errorHandler';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'your_jwt_secret'
};

passport.use(
  new JwtStrategy(
    jwtOptions,
    async (payload: JwtPayload, done: (error: any, user?: any, info?: any) => void) => {
      try {
        const employeeRepository = AppDataSource.getRepository(Employee);
        const employee = await employeeRepository.findOne({
          where: { id: payload.id }
        });

        if (!employee) {
          return done(null, false);
        }

        return done(null, employee);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', { session: false }, (err: Error, user: Employee) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return next(new ApiError('Unauthorized', 401));
    }
    req.user = user;
    next();
  })(req, res, next);
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError('Unauthorized', 401));
    }

    const employee = req.user as Employee;
    if (!roles.includes(employee.role)) {
      return next(new ApiError('Forbidden', 403));
    }

    next();
  };
}; 