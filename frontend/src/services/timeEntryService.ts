import { TimeEntry } from '../types/timeEntry';
import { AuditLog } from '../types/audit';

interface TimeEntryResponse {
  entries: TimeEntry[];
  total: number;
  auditLogs?: AuditLog[];
}

export const timeEntryService = {
  async getEntries(params: { page: number; limit: number }): Promise<TimeEntryResponse> {
    const response = await fetch(`/api/time-entries?page=${params.page}&limit=${params.limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch time entries');
    }
    return await response.json();
  },

  async bulkAction(action: string, entryIds: string[], notes?: string): Promise<void> {
    const response = await fetch('/api/time-entries/bulk-action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        entryIds,
        notes
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to perform bulk action');
    }
  }
}; 