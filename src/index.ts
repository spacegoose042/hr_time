import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import passport from 'passport';
import { errorHandler } from './middleware/errorHandler';
import { setupRoutes } from './routes';
import { setupDatabase } from './db/init-db';
import { sendWeeklyReports, sendOverdueReminders } from './services/schedulerService';

dotenv.config();

const startServer = async () => {
  try {
    await setupDatabase();
    
    const app = express();
    const port = process.env.PORT || 3002;

    app.use(cors());
    app.use(helmet());
    app.use(express.json());
    app.use(passport.initialize());

    setupRoutes(app);
    app.use(errorHandler);

    // Set up schedulers
    // Weekly reports every Monday at 8 AM
    setInterval(() => {
      const now = new Date();
      if (now.getDay() === 1 && now.getHours() === 8 && now.getMinutes() === 0) {
        sendWeeklyReports();
      }
    }, 60000); // Check every minute

    // Overdue reminders every 4 hours
    setInterval(() => {
      sendOverdueReminders();
    }, 4 * 60 * 60 * 1000);

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 