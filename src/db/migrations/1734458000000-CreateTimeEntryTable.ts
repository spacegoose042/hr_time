import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTimeEntryTable1734458000000 implements MigrationInterface {
    name = 'CreateTimeEntryTable1734458000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS time_entries (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
                clock_in TIMESTAMP NOT NULL,
                clock_out TIMESTAMP,
                status VARCHAR NOT NULL DEFAULT 'pending',
                notes TEXT,
                created_at TIMESTAMP DEFAULT now(),
                updated_at TIMESTAMP DEFAULT now()
            )
        `);

        // Create indexes for common queries
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_time_entries_employee_id ON time_entries(employee_id);
            CREATE INDEX IF NOT EXISTS idx_time_entries_status ON time_entries(status);
            CREATE INDEX IF NOT EXISTS idx_time_entries_clock_in ON time_entries(clock_in);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS time_entries`);
    }
} 