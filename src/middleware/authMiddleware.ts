import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Employee } from '../entities/Employee';
import AppDataSource from '../db/connection';
import { ApiError } from './errorHandler';
import { UserRole, ROLE_HIERARCHY } from '../auth/roles/roles';

interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
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

export const requireRole = (role: UserRole) => {
  return (_req: Request, _res: Response, next: NextFunction) => {
    passport.authenticate('jwt', { session: false }, (err, user) => {
      if (err || !user || user.role !== role) {
        return next(new ApiError('Unauthorized', 403));
      }
      next();
    })(req, res, next);
  };
}; 