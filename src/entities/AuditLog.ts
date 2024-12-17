import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Employee } from './Employee';

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  APPROVE = 'approve',
  REJECT = 'reject',
  CLOCK_IN = 'clock_in',
  CLOCK_OUT = 'clock_out',
  FAILED_LOGIN = 'failed_login',
  SUCCESSFUL_LOGIN = 'successful_login',
  PASSWORD_RESET = 'password_reset',
  FAILED_PASSWORD_ATTEMPT = 'failed_password_attempt'
}

export type AuditMetadata = {
  ip?: string;
  userAgent?: string;
  before?: any;
  after?: any;
  reason?: string;
  attempt?: number;
  [key: string]: any;
};

export type AuditTargetType = 'time_entry' | 'employee';

@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'actor_id' })
  actor: Employee;

  @Column({
    type: 'enum',
    enum: AuditAction
  })
  action: AuditAction;

  @Column({
    type: 'varchar'
  })
  target_type: AuditTargetType;

  @Column()
  target_id: string;

  @Column('jsonb')
  metadata: AuditMetadata;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;
} 