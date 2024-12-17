import { TimeEntry } from '../components/TimeHistory';

interface TimeEntryResponse {
  entries: TimeEntry[];
  total: number;
  page: number;
  limit: number;
}

interface TimeEntryFilters {
  page?: number;
  limit?: number;
  projects?: string[];
  tasks?: string[];
  startDate?: Date;
  endDate?: Date;
}

export const timeEntryService = {
  async getEntries(filters: TimeEntryFilters = {}): Promise<TimeEntryResponse> {
    const params = new URLSearchParams();
    
    if (filters.page) params.set('page', filters.page.toString());
    if (filters.limit) params.set('limit', filters.limit.toString());
    if (filters.projects?.length) params.set('projects', filters.projects.join(','));
    if (filters.tasks?.length) params.set('tasks', filters.tasks.join(','));
    
    const response = await fetch(`/api/time-entries?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch time entries');
    }
    return response.json();
  },

  async bulkAction(action: 'approve' | 'reject' | 'delete', entryIds: string[], notes?: string) {
    const response = await fetch('/api/time-entries/bulk-action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, entryIds, notes })
    });

    if (!response.ok) {
      throw new Error(`Failed to ${action} entries`);
    }
    return response.json();
  }
}; 