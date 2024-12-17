import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Employee } from './Employee';

@Entity('password_history')
export class PasswordHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Employee, employee => employee.passwordHistory, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'employee_id' })
    employee: Employee;

    @Column()
    password_hash: string;

    @CreateDateColumn()
    created_at: Date;
} 