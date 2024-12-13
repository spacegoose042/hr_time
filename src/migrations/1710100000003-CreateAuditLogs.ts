import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateAuditLogs1710100000003 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // First create the enum type
        await queryRunner.query(`
            CREATE TYPE audit_action AS ENUM (
                'force_close',
                'override_validation',
                'bulk_update'
            );
        `);

        await queryRunner.createTable(new Table({
            name: 'audit_logs',
            columns: [
                {
                    name: 'id',
                    type: 'uuid',
                    isPrimary: true,
                    default: 'uuid_generate_v4()'
                },
                {
                    name: 'actor_id',
                    type: 'uuid'
                },
                {
                    name: 'time_entry_id',
                    type: 'uuid'
                },
                {
                    name: 'action',
                    type: 'audit_action'
                },
                {
                    name: 'changes',
                    type: 'jsonb'
                },
                {
                    name: 'reason',
                    type: 'text'
                },
                {
                    name: 'override_details',
                    type: 'jsonb',
                    isNullable: true
                },
                {
                    name: 'created_at',
                    type: 'timestamp',
                    default: 'now()'
                }
            ],
            foreignKeys: [
                {
                    columnNames: ['actor_id'],
                    referencedTableName: 'employees',
                    referencedColumnNames: ['id'],
                    onDelete: 'CASCADE'
                },
                {
                    columnNames: ['time_entry_id'],
                    referencedTableName: 'time_entries',
                    referencedColumnNames: ['id'],
                    onDelete: 'CASCADE'
                }
            ]
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('audit_logs');
        await queryRunner.query('DROP TYPE audit_action;');
    }
} 