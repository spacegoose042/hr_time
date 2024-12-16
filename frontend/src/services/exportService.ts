import { TimeEntry } from '../components/TimeHistory';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

interface ExportOptions {
  startDate?: Date;
  endDate?: Date;
  action?: string;
  searchTerm?: string;
}

export const exportToCSV = (entries: TimeEntry[]) => {
  const csvData = entries.map(entry => ({
    'Clock In': new Date(entry.clock_in).toLocaleString(),
    'Clock Out': entry.clock_out ? new Date(entry.clock_out).toLocaleString() : 'Not clocked out',
    'Duration': calculateDuration(entry),
    'Break': entry.break_minutes ? `${entry.break_minutes} min` : 'No break',
    'Status': entry.status.charAt(0).toUpperCase() + entry.status.slice(1),
    'Project': entry.project || '',
    'Task': entry.task || '',
    'Notes': entry.notes || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(csvData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Time Entries');
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  saveAs(data, `time-entries-${new Date().toISOString().split('T')[0]}.xlsx`);
};

const calculateDuration = (entry: TimeEntry): string => {
  if (!entry.clock_out) return 'In progress';
  
  const start = new Date(entry.clock_in);
  const end = new Date(entry.clock_out);
  const diffMs = end.getTime() - start.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
};

export class ExportService {
  static async exportAuditLogs(format: 'csv' | 'json', options: ExportOptions = {}) {
    try {
      const queryParams = new URLSearchParams({
        format,
        ...(options.startDate && { startDate: options.startDate.toISOString() }),
        ...(options.endDate && { endDate: options.endDate.toISOString() }),
        ...(options.action && { action: options.action }),
        ...(options.searchTerm && { search: options.searchTerm })
      });

      const response = await fetch(`/api/admin/audit-logs/export?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to export audit logs');
      }

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `audit_logs_${timestamp}.${format}`;

      if (format === 'json') {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        saveAs(blob, filename);
      } else {
        const text = await response.text();
        const blob = new Blob([text], { type: 'text/csv' });
        saveAs(blob, filename);
      }
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }
} 