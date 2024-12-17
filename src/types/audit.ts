import { AuditLog } from '../entities/AuditLog';

export interface FormattedAuditLog {
  timestamp: Date;
  action: string;
  actor_name: string;
  actor_email: string;
  target_type: string;
  target_id: string;
  ip: string;
  user_agent: string;
  notes: string | null;
}

export interface AuditLogResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
} 