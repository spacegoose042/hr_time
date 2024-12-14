import { Express, Router } from 'express';
import express from 'express';
import authRoutes from '../auth/routes/authRoutes';
import adminRoutes from './admin.routes';
import timeEntryRoutes from './timeEntry.routes';
import path from 'path';

export const setupRoutes = (app: Express) => {
  // Serve static files from a public directory
  app.use(express.static(path.join(__dirname, '../../public')));

  const apiRouter = Router();

  // Mount routes
  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/admin', adminRoutes);
  apiRouter.use('/time', timeEntryRoutes);

  // Mount all routes under /api
  app.use('/api', apiRouter);
}; 