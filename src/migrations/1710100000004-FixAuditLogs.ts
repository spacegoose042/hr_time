import { MigrationInterface, QueryRunner } from "typeorm";

export class FixAuditLogs1710100000004 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // First check if the enum exists
        const enumExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM pg_type WHERE typname = 'audit_action'
            );
        `);

        // Drop existing enum if it exists
        if (enumExists[0].exists) {
            await queryRunner.query('DROP TYPE audit_action CASCADE;');
        }

        // Create enum
        await queryRunner.query(`
            CREATE TYPE audit_action AS ENUM (
                'force_close',
                'override_validation',
                'bulk_update'
            );
        `);

        // Check if table exists
        const tableExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_name = 'audit_logs'
            );
        `);

        // Drop existing table if it exists
        if (tableExists[0].exists) {
            await queryRunner.query('DROP TABLE audit_logs CASCADE;');
        }

        // Create table
        await queryRunner.query(`
            CREATE TABLE audit_logs (
                id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                actor_id uuid REFERENCES employees(id) ON DELETE CASCADE,
                time_entry_id uuid REFERENCES time_entries(id) ON DELETE CASCADE,
                action audit_action NOT NULL,
                changes jsonb NOT NULL,
                reason text NOT NULL,
                override_details jsonb,
                created_at timestamp DEFAULT now()
            );
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE IF EXISTS audit_logs CASCADE;');
        await queryRunner.query('DROP TYPE IF EXISTS audit_action CASCADE;');
    }
} 