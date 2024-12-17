import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1734457157125 implements MigrationInterface {
    name = 'InitialSchema1734457157125'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create user_role enum
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
                    CREATE TYPE user_role AS ENUM ('admin', 'manager', 'employee');
                END IF;
            END $$;
        `);

        // Create employees table if it doesn't exist
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS employees (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                first_name VARCHAR NOT NULL,
                last_name VARCHAR NOT NULL,
                email VARCHAR UNIQUE NOT NULL,
                password_hash VARCHAR NOT NULL,
                role user_role NOT NULL DEFAULT 'employee',
                status VARCHAR NOT NULL DEFAULT 'active',
                hire_date TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT now(),
                updated_at TIMESTAMP DEFAULT now(),
                reset_token VARCHAR,
                reset_token_expires TIMESTAMP,
                login_attempts INTEGER DEFAULT 0,
                last_login_attempt TIMESTAMP,
                last_successful_login TIMESTAMP
            )
        `);

        // Create password_history table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS password_history (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
                password_hash VARCHAR NOT NULL,
                created_at TIMESTAMP DEFAULT now()
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS password_history`);
        await queryRunner.query(`DROP TABLE IF EXISTS employees`);
        await queryRunner.query(`DROP TYPE IF EXISTS user_role`);
    }
} 