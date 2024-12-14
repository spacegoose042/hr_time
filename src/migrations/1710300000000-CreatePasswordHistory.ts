import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreatePasswordHistory1710300000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "password_history",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    generationStrategy: "uuid",
                    default: "uuid_generate_v4()"
                },
                {
                    name: "password_hash",
                    type: "varchar",
                    isNullable: false
                },
                {
                    name: "employeeId",
                    type: "uuid",
                    isNullable: false
                },
                {
                    name: "created_at",
                    type: "timestamp",
                    default: "now()"
                }
            ]
        }));

        await queryRunner.createForeignKey("password_history", new TableForeignKey({
            columnNames: ["employeeId"],
            referencedColumnNames: ["id"],
            referencedTableName: "employees",
            onDelete: "CASCADE"
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("password_history");
    }
} 