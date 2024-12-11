import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmployeeIdColumn1710100000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "time_entries" 
            ADD COLUMN "employeeId" uuid REFERENCES "employees"("id") ON DELETE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "time_entries" 
            DROP COLUMN "employeeId"
        `);
    }
} 