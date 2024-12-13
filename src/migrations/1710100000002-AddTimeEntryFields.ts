import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddTimeEntryFields1710100000002 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumns('time_entries', [
            new TableColumn({
                name: 'project',
                type: 'varchar',
                isNullable: true
            }),
            new TableColumn({
                name: 'task',
                type: 'varchar',
                isNullable: true
            }),
            new TableColumn({
                name: 'break_minutes',
                type: 'int',
                isNullable: true
            }),
            new TableColumn({
                name: 'break_notes',
                type: 'text',
                isNullable: true
            })
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumns('time_entries', [
            'project',
            'task',
            'break_minutes',
            'break_notes'
        ]);
    }
} 