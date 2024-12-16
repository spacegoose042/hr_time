import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Employee } from './Employee';

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
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  employeeId: string;

  @ManyToOne(() => Employee)
  employee: Employee;

  @Column({
    type: 'enum',
    enum: AuditAction
  })
  action: AuditAction;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  ip_address: string;

  @Column({ nullable: true })
  user_agent: string;

  @CreateDateColumn()
  created_at: Date;
} 