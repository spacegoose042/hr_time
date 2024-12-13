import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Employee } from './Employee';
import { TimeEntry } from './TimeEntry';

export enum AuditAction {
  FORCE_CLOSE = 'force_close',
  OVERRIDE_VALIDATION = 'override_validation',
  BULK_UPDATE = 'bulk_update'
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'actor_id' })
  actor: Employee;

  @Column('uuid')
  actor_id: string;

  @ManyToOne(() => TimeEntry, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'time_entry_id' })
  timeEntry: TimeEntry;

  @Column('uuid')
  time_entry_id: string;

  @Column({
    type: 'enum',
    enum: AuditAction
  })
  action: AuditAction;

  @Column('jsonb')
  changes: any;

  @Column('text')
  reason: string;

  @Column('jsonb', { nullable: true })
  override_details?: any;

  @CreateDateColumn()
  created_at: Date;
} 