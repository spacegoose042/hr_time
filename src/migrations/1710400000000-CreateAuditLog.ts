import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateAuditLog1710400000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE audit_action AS ENUM (
                'PASSWORD_RESET',
                'PASSWORD_CHANGE',
                'FAILED_PASSWORD_ATTEMPT',
                'ACCOUNT_LOCKED',
                'ACCOUNT_UNLOCKED'
            )
        `);

        await queryRunner.createTable(new Table({
            name: "audit_logs",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    generationStrategy: "uuid",
                    default: "uuid_generate_v4()"
                },
                {
                    name: "employeeId",
                    type: "uuid",
                    isNullable: false
                },
                {
                    name: "action",
                    type: "audit_action",
                    isNullable: false
                },
                {
                    name: "metadata",
                    type: "jsonb",
                    isNullable: true
                },
                {
                    name: "ip_address",
                    type: "varchar",
                    isNullable: true
                },
                {
                    name: "user_agent",
                    type: "varchar",
                    isNullable: true
                },
                {
                    name: "created_at",
                    type: "timestamp",
                    default: "now()"
                }
            ]
        }));

        await queryRunner.createForeignKey("audit_logs", new TableForeignKey({
            columnNames: ["employeeId"],
            referencedColumnNames: ["id"],
            referencedTableName: "employees",
            onDelete: "CASCADE"
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("audit_logs");
        await queryRunner.query(`DROP TYPE audit_action`);
    }
} 