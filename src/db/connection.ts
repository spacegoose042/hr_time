import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Employee } from '../entities/Employee';
import { TimeEntry } from '../entities/TimeEntry';
import { AuditLog } from '../entities/AuditLog';
import { PasswordHistory } from '../entities/PasswordHistory';

config(); // Load environment variables

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: true, // Set to false in production
    logging: true,
    entities: [
        Employee,
        TimeEntry,
        AuditLog,
        PasswordHistory
    ],
    migrations: ['src/db/migrations/**/*.ts'],
    subscribers: []
});

export default AppDataSource; 