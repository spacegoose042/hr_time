import { Express } from 'express';

export const setupRoutes = (app: Express) => {
  // Health check route
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // TODO: Add other routes here
}; 