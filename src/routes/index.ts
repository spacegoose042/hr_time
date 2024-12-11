import { Express, Router } from 'express';

export const setupRoutes = (app: Express) => {
  const apiRouter = Router();

  // Health check route
  apiRouter.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Mount all routes under /api
  app.use('/api', apiRouter);

  // TODO: Add routes for:
  // - Authentication (/api/auth)
  // - Employees (/api/employees)
  // - Time Clock (/api/time-clock)
  // - PTO (/api/pto)
}; 