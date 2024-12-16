import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Employee } from './Employee';

@Entity('password_history')
export class PasswordHistory {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  password_hash: string;

  @Column()
  employeeId: string;

  @ManyToOne(() => Employee, employee => employee.passwordHistory)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @CreateDateColumn()
  created_at: Date;
} 