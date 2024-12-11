import { Express, Router } from 'express';
import authRoutes from '../auth/routes/authRoutes';
import adminRoutes from './admin.routes';
import timeEntryRoutes from './timeEntry.routes';

export const setupRoutes = (app: Express) => {
  const apiRouter = Router();

  // Mount routes
  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/admin', adminRoutes);
  apiRouter.use('/time', timeEntryRoutes);

  // Mount all routes under /api
  app.use('/api', apiRouter);
}; 