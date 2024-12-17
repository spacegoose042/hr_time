import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAuditLogTable1734458000001 implements MigrationInterface {
    name = 'CreateAuditLogTable1734458000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE audit_action AS ENUM (
                'create', 'update', 'delete', 'approve', 'reject',
                'clock_in', 'clock_out', 'login', 'failed_login',
                'successful_login', 'password_reset', 'failed_password_attempt'
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS audit_log (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                actor_id UUID REFERENCES employees(id) ON DELETE SET NULL,
                action audit_action NOT NULL,
                target_type VARCHAR NOT NULL,
                target_id VARCHAR NOT NULL,
                metadata JSONB NOT NULL DEFAULT '{}',
                notes TEXT,
                created_at TIMESTAMP DEFAULT now()
            )
        `);

        // Create indexes for common queries
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_audit_log_actor_id ON audit_log(actor_id);
            CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
            CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS audit_log`);
        await queryRunner.query(`DROP TYPE IF EXISTS audit_action`);
    }
} 