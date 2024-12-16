import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn, OneToMany } from 'typeorm';
import { Employee } from './Employee';
import { AuditLog } from './AuditLog';

@Entity('time_entries')
export class TimeEntry {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  employeeId: string;

  @Column({ type: 'timestamp' })
  clock_in: Date;

  @Column({ type: 'timestamp', nullable: true })
  clock_out: Date | null;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'int', nullable: true })
  break_minutes: number | null;

  @Column({ type: 'text', nullable: true })
  break_notes: string | null;

  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @Column({ type: 'text', nullable: true })
  project: string | null;

  @Column({ type: 'text', nullable: true })
  task: string | null;

  @OneToMany(() => AuditLog, audit => audit.timeEntry, { cascade: true })
  auditLogs: AuditLog[];

  @ManyToOne(() => Employee, { nullable: true })
  approver: Employee | null;
} 