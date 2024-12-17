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

  @Column()
  target_type: string;

  @Column()
  target_id: string;

  @Column('jsonb')
  metadata: Record<string, any>;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;
} 