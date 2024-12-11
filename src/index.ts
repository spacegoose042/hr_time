import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import passport from 'passport';
import { errorHandler } from './middleware/errorHandler';
import { setupRoutes } from './routes';
import { setupDatabase } from './db/connection';

// Load environment variables before using them
dotenv.config();

const app = express();
// Log the port to debug
console.log('Using port:', process.env.PORT);
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(passport.initialize());

// Setup routes
setupRoutes(app);

// Error handling
app.use(errorHandler);

// Database connection and server startup
const startServer = async () => {
  try {
    await setupDatabase();
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 