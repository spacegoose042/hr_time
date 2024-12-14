import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Employee } from './Employee';

@Entity('password_history')
export class PasswordHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  password_hash: string;

  @Column()
  employeeId: string;

  @ManyToOne(() => Employee, employee => employee.passwordHistory)
  employee: Employee;

  @CreateDateColumn()
  created_at: Date;
} 