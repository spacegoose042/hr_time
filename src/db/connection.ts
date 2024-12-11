import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import path from 'path';
import { Employee } from '../entities/Employee';
import { TimeEntry } from '../entities/TimeEntry';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'hr_time',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [Employee, TimeEntry],
  migrations: [path.join(__dirname, '..', 'migrations', '**', '*.ts')],
});

export const setupDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established');
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
};

export default AppDataSource; 