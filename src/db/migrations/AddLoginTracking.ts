import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddLoginTracking implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumns("employee", [
            new TableColumn({
                name: "login_attempts",
                type: "integer",
                default: 0
            }),
            new TableColumn({
                name: "last_login_attempt",
                type: "timestamp",
                isNullable: true
            }),
            new TableColumn({
                name: "last_successful_login",
                type: "timestamp",
                isNullable: true
            })
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumns("employee", [
            "login_attempts",
            "last_login_attempt",
            "last_successful_login"
        ]);
    }
} 