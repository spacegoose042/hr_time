import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config(); // Load environment variables

export const TestDataSource = new DataSource({
  type: 'postgres',
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5432'),
  username: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'postgres',
  database: process.env.TEST_DB_NAME || 'hr_time_test',
  entities: ['src/entities/**/*.ts'],
  migrations: ['src/db/migrations/**/*.ts'],
  synchronize: true // Only for testing!
}); 