import { DataSource } from 'typeorm';
import { Employee } from '../entities/Employee';
import { TimeEntry } from '../entities/TimeEntry';
import { AuditLog } from '../entities/AuditLog';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('Database config:', {
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DB,
  username: process.env.POSTGRES_USER
});

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'hr_time',
  synchronize: false,
  logging: true,
  entities: [Employee, TimeEntry, AuditLog],
  migrations: ['src/migrations/*.ts']
});

AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
  })
  .catch((err) => {
    console.error('Error during Data Source initialization:', err);
    console.error('Error details:', {
      name: err.name,
      message: err.message,
      code: err.code,
      stack: err.stack
    });
  });

export default AppDataSource; 