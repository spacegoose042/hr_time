import { MigrationInterface, QueryRunner } from "typeorm";

export class EnhanceAuditLogs1710100000005 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add new enum values
        await queryRunner.query(`
            ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'time_adjustment';
            ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'status_change';
        `);

        // Add new columns
        await queryRunner.query(`
            ALTER TABLE audit_logs
            ADD COLUMN ip_address inet,
            ADD COLUMN user_agent text,
            ADD COLUMN metadata jsonb,
            ADD COLUMN session_id text,
            ADD COLUMN requires_review boolean DEFAULT false,
            ADD COLUMN tags text[] DEFAULT '{}';
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE audit_logs
            DROP COLUMN ip_address,
            DROP COLUMN user_agent,
            DROP COLUMN metadata,
            DROP COLUMN session_id,
            DROP COLUMN requires_review,
            DROP COLUMN tags;
        `);
    }
} 