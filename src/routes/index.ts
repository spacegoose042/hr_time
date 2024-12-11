import { Express, Router } from 'express';
import authRoutes from '../auth/routes/authRoutes';
import adminRoutes from './admin.routes';
import timeEntryRoutes from './timeEntry.routes';

export const setupRoutes = (app: Express) => {
  const apiRouter = Router();

  // Root route
  app.get('/', (req, res) => {
    res.json({
      message: 'HR Time Clock API',
      version: '1.0.0',
      endpoints: {
        health: '/api/health',
        auth: {
          login: '/api/auth/login',
          register: '/api/auth/register',
          me: '/api/auth/me'
        },
        admin: {
          employees: '/api/admin/employees'
        },
        time: {
          clockIn: '/api/time/clock-in',
          clockOut: '/api/time/clock-out',
          entries: '/api/time/entries'
        }
      }
    });
  });

  // Health check route
  apiRouter.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Mount routes
  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/admin', adminRoutes);
  apiRouter.use('/time', timeEntryRoutes);

  // Mount all routes under /api
  app.use('/api', apiRouter);
}; 