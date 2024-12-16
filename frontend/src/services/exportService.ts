import { TimeEntry } from '../components/TimeHistory';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

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
    // ... implementation
  }
} 