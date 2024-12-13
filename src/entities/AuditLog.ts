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

  @Column({ name: 'actor_id' })
  actorId: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'actor_id' })
  actor: Employee;

  @Column({ name: 'time_entry_id' })
  timeEntryId: string;

  @ManyToOne(() => TimeEntry)
  @JoinColumn({ name: 'time_entry_id' })
  timeEntry: TimeEntry;

  @Column({
    type: 'enum',
    enum: AuditAction
  })
  action: AuditAction;

  @Column({ type: 'jsonb' })
  changes: any;

  @Column({ type: 'text' })
  reason: string;

  @Column({ name: 'override_details', type: 'jsonb', nullable: true })
  overrideDetails: any;

  @CreateDateColumn()
  created_at: Date;
} 