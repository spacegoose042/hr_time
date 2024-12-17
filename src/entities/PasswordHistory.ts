import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Employee } from './Employee';

@Entity()
export class PasswordHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Employee, employee => employee.passwordHistory)
    employee: Employee;

    @Column()
    password_hash: string;

    @CreateDateColumn()
    created_at: Date;
} 