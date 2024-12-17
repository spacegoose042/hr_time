import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { UserRole } from '../auth/roles/roles';
import { PasswordHistory } from './PasswordHistory';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password_hash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.EMPLOYEE
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive'],
    default: 'active'
  })
  status: string;

  @Column({ type: 'timestamp' })
  hire_date: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'varchar', nullable: true })
  reset_token: string | null;

  @Column({ type: 'timestamp', nullable: true })
  reset_token_expires: Date | null;

  @Column({ type: 'integer', default: 0 })
  login_attempts: number;

  @Column({ type: 'timestamp', nullable: true })
  last_login_attempt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  last_successful_login: Date | null;

  @OneToMany(() => PasswordHistory, history => history.employee)
  passwordHistory: PasswordHistory[];
} 