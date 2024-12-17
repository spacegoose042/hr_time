import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class UpdateAuditLogSchema implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add new columns first
        await queryRunner.addColumns("audit_log", [
            new TableColumn({
                name: "target_type",
                type: "varchar",
                isNullable: false,
                default: "'time_entry'"
            }),
            new TableColumn({
                name: "target_id",
                type: "varchar",
                isNullable: false,
                default: "'legacy'"
            }),
            new TableColumn({
                name: "metadata",
                type: "jsonb",
                isNullable: false,
                default: "{}"
            })
        ]);

        // Migrate existing data
        await queryRunner.query(`
            UPDATE audit_log 
            SET metadata = jsonb_build_object(
                'ip', ip_address,
                'userAgent', user_agent,
                'oldMetadata', metadata
            ),
            target_type = CASE 
                WHEN time_entry_id IS NOT NULL THEN 'time_entry'
                ELSE 'employee'
            END,
            target_id = COALESCE(time_entry_id::text, employee_id::text)
        `);

        // Drop old columns
        await queryRunner.dropColumns("audit_log", [
            "ip_address",
            "user_agent",
            "time_entry_id",
            "employee_id"
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert changes if needed
        await queryRunner.addColumns("audit_log", [
            new TableColumn({
                name: "ip_address",
                type: "varchar",
                isNullable: true
            }),
            new TableColumn({
                name: "user_agent",
                type: "varchar",
                isNullable: true
            }),
            new TableColumn({
                name: "employee_id",
                type: "uuid",
                isNullable: true
            }),
            new TableColumn({
                name: "time_entry_id",
                type: "uuid",
                isNullable: true
            })
        ]);

        // Restore data
        await queryRunner.query(`
            UPDATE audit_log 
            SET ip_address = metadata->>'ip',
                user_agent = metadata->>'userAgent',
                employee_id = CASE WHEN target_type = 'employee' THEN target_id::uuid END,
                time_entry_id = CASE WHEN target_type = 'time_entry' THEN target_id::uuid END
        `);

        await queryRunner.dropColumns("audit_log", [
            "target_type",
            "target_id",
            "metadata"
        ]);
    }
} 