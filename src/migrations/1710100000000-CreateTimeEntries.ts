import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateTimeEntries1710100000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "time_entries",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    default: "uuid_generate_v4()"
                },
                {
                    name: "employee_id",
                    type: "uuid"
                },
                {
                    name: "clock_in",
                    type: "timestamp"
                },
                {
                    name: "clock_out",
                    type: "timestamp",
                    isNullable: true
                },
                {
                    name: "notes",
                    type: "text",
                    isNullable: true
                },
                {
                    name: "status",
                    type: "enum",
                    enum: ["pending", "approved", "rejected"],
                    default: "'pending'"
                },
                {
                    name: "created_at",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
                },
                {
                    name: "updated_at",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
                }
            ]
        }));

        await queryRunner.createForeignKey("time_entries", new TableForeignKey({
            columnNames: ["employee_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "employees",
            onDelete: "CASCADE"
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("time_entries");
    }
} 