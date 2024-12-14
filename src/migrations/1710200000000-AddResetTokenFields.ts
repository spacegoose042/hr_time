import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddResetTokenFields1710200000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumns('employees', [
            new TableColumn({
                name: 'reset_token',
                type: 'varchar',
                isNullable: true
            }),
            new TableColumn({
                name: 'reset_token_expires',
                type: 'timestamp',
                isNullable: true
            })
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumns('employees', [
            'reset_token',
            'reset_token_expires'
        ]);
    }
} 