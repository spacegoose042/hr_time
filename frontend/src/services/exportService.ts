import { TimeEntry } from '../components/TimeHistory';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export type ExportFormat = 'xlsx' | 'csv' | 'pdf' | 'json';

export interface ExportRow extends TimeEntry {
  'Clock In': string;
  'Clock Out': string;
  'Duration': string;
  'Break': string;
  'Status': string;
  'Project': string;
  'Task': string;
  'Notes': string;
}

export interface ExportOptions {
  format: ExportFormat;
  columns?: string[];
  dateFormat?: string;
  includeHeaders?: boolean;
  groupBy?: 'day' | 'week' | 'month' | 'project';
  sortBy?: keyof TimeEntry;
  sortOrder?: 'asc' | 'desc';
  customFileName?: string;
}

export const exportTimeEntries = (entries: TimeEntry[], options: ExportOptions) => {
  const {
    format,
    groupBy,
    sortBy,
    sortOrder = 'desc',
    customFileName
  } = options;

  // Process data based on options
  let processedData = entries;

  // Sort data if requested
  if (sortBy) {
    processedData = sortData(processedData, sortBy, sortOrder);
  }

  // Group data if requested
  if (groupBy) {
    processedData = Object.values(groupTimeEntries(processedData, groupBy)).flat();
  }

  // Format data for export
  const formattedData = formatEntriesForExport(processedData);

  // Generate filename
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = customFileName || `time-entries-${timestamp}`;

  // Export based on format
  switch (format) {
    case 'xlsx':
      exportToExcel(formattedData, filename);
      break;
    case 'csv':
      exportToCSV(formattedData, filename);
      break;
    case 'pdf':
      exportToPDF(formattedData, filename);
      break;
    case 'json':
      exportToJSON(entries, filename); // Use original entries for JSON
      break;
  }
};

const sortData = (data: TimeEntry[], sortBy: keyof TimeEntry, sortOrder: 'asc' | 'desc'): TimeEntry[] => {
  return [...data].sort((a, b) => {
    const aVal = String(a[sortBy] ?? '');
    const bVal = String(b[sortBy] ?? '');
    return sortOrder === 'asc' ? 
      aVal.localeCompare(bVal) : 
      bVal.localeCompare(aVal);
  });
};

const groupTimeEntries = (entries: TimeEntry[], groupBy: string): Record<string, TimeEntry[]> => {
  return entries.reduce((groups, entry) => {
    let key: string;
    switch (groupBy) {
      case 'day':
        key = new Date(entry.clock_in).toDateString();
        break;
      case 'week':
        key = `Week ${getWeekNumber(new Date(entry.clock_in))}`;
        break;
      case 'project':
        key = entry.project || 'No Project';
        break;
      default:
        key = 'default';
    }
    
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(entry);
    return groups;
  }, {} as Record<string, TimeEntry[]>);
};

const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const formatEntriesForExport = (entries: TimeEntry[]): TimeEntry[] => {
  return entries.map(entry => ({
    ...entry, // Keep all original TimeEntry properties
    'Clock In': new Date(entry.clock_in).toLocaleString(),
    'Clock Out': entry.clock_out ? new Date(entry.clock_out).toLocaleString() : 'Not clocked out',
    'Duration': calculateDuration(entry),
    'Break': entry.break_minutes ? `${entry.break_minutes} min` : 'No break',
    'Status': entry.status.charAt(0).toUpperCase() + entry.status.slice(1),
    'Project': entry.project || '',
    'Task': entry.task || '',
    'Notes': entry.notes || ''
  }));
};

const exportToExcel = (data: ExportRow[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Time Entries');
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}.xlsx`);
};

export const exportToCSV = (data: TimeEntry[], filename?: string) => {
  const formattedData = formatEntriesForExport(data);
  const csv = Papa.unparse(formattedData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const defaultFilename = `time-entries-${new Date().toISOString().split('T')[0]}.csv`;
  saveAs(blob, filename || defaultFilename);
};

const exportToPDF = (data: ExportRow[], filename: string) => {
  const doc = new jsPDF();
  doc.autoTable({
    head: [Object.keys(data[0])],
    body: data.map(Object.values),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [66, 66, 66] }
  });
  doc.save(`${filename}.pdf`);
};

const exportToJSON = (entries: TimeEntry[], filename: string) => {
  const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
  saveAs(blob, `${filename}.json`);
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

interface AuditLogExportOptions {
  startDate?: Date;
  endDate?: Date;
  action?: string;
  searchTerm?: string;
}

export class ExportService {
  static async exportAuditLogs(format: 'csv' | 'json', options: AuditLogExportOptions = {}) {
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