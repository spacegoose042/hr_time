import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Employee } from './Employee';
import { TimeEntry } from './TimeEntry';

export enum AuditAction {
  FORCE_CLOSE = 'force_close',
  OVERRIDE_VALIDATION = 'override_validation',
  BULK_UPDATE = 'bulk_update',
  TIME_ADJUSTMENT = 'time_adjustment',
  STATUS_CHANGE = 'status_change'
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

  @Column('inet', { nullable: true })
  ip_address: string;

  @Column('text', { nullable: true })
  user_agent: string;

  @Column('jsonb', { nullable: true })
  metadata: {
    browser?: string;
    os?: string;
    device?: string;
    location?: {
      city?: string;
      country?: string;
    };
  };

  @Column('text', { nullable: true })
  session_id: string;

  @Column('boolean', { default: false })
  requires_review: boolean;

  @Column('text', { array: true, default: '{}' })
  tags: string[];

  @CreateDateColumn()
  created_at: Date;
} 