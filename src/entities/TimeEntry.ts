import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Employee } from './Employee';

@Entity('time_entries')
export class TimeEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'employee_id' })
  employeeId: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ type: 'timestamp' })
  clock_in: Date;

  @Column({ type: 'timestamp', nullable: true })
  clock_out: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  })
  status: 'pending' | 'approved' | 'rejected';

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'varchar', nullable: true })
  project: string;

  @Column({ type: 'varchar', nullable: true })
  task: string;

  @Column({ type: 'int', nullable: true, name: 'break_minutes' })
  break_minutes: number;

  @Column({ type: 'text', nullable: true, name: 'break_notes' })
  break_notes: string;
} 