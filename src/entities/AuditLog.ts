import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Employee } from './Employee';
import { TimeEntry } from './TimeEntry';

export enum AuditAction {
  PASSWORD_RESET = 'PASSWORD_RESET',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  FAILED_PASSWORD_ATTEMPT = 'FAILED_PASSWORD_ATTEMPT',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
  OVERRIDE_VALIDATION = 'OVERRIDE_VALIDATION',
  FORCE_CLOSE = 'FORCE_CLOSE'
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'employee_id' })
  employeeId: string;

  @ManyToOne(() => Employee, { eager: true })
  employee: Employee;

  @Column({
    type: 'enum',
    enum: AuditAction,
    name: 'action'
  })
  action: AuditAction;

  @Column('jsonb', { name: 'metadata', nullable: true })
  metadata: any;

  @Column({ name: 'ip_address', nullable: true })
  ip_address: string;

  @Column({ name: 'user_agent', nullable: true })
  user_agent: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ManyToOne(() => TimeEntry, timeEntry => timeEntry.auditLogs, { nullable: true })
  timeEntry: TimeEntry;
} 