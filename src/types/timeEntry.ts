import { TimeEntry } from '../entities/TimeEntry';

export interface TimeReport {
  totalHours: number;
  entries: TimeEntry[];
  summary: {
    approved: number;
    pending: number;
    rejected: number;
  };
} 