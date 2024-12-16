import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Employee } from './Employee';

@Entity('password_history')
export class PasswordHistory {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'password_hash' })
  password_hash: string;

  @Column({ name: 'employee_id' })
  employeeId: string;

  @ManyToOne(() => Employee, employee => employee.passwordHistory, { eager: true })
  employee: Employee;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
} 