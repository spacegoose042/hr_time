import { Express, Router } from 'express';
import authRoutes from '../auth/routes/authRoutes';

export const setupRoutes = (app: Express) => {
  const apiRouter = Router();

  // Root route (http://localhost:3001/)
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
        }
      }
    });
  });

  // Health check route
  apiRouter.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Auth routes
  apiRouter.use('/auth', authRoutes);

  // Mount all routes under /api
  app.use('/api', apiRouter);
}; 