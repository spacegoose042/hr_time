import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class InitialMigration1710000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE user_role AS ENUM ('admin', 'manager', 'employee')`);
        
        await queryRunner.createTable(new Table({
            name: "employees",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    default: "uuid_generate_v4()"
                },
                {
                    name: "email",
                    type: "varchar",
                    isUnique: true
                },
                {
                    name: "password_hash",
                    type: "varchar"
                },
                {
                    name: "first_name",
                    type: "varchar"
                },
                {
                    name: "last_name",
                    type: "varchar"
                },
                {
                    name: "role",
                    type: "user_role",
                    default: "'employee'"
                },
                {
                    name: "status",
                    type: "varchar",
                    default: "'active'"
                },
                {
                    name: "hire_date",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
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
        }), true);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("employees");
        await queryRunner.query(`DROP TYPE user_role`);
    }
} 