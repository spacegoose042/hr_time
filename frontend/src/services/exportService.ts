import { format as dateFormat } from 'date-fns';

export interface ExportOptions {
  startDate?: Date;
  endDate?: Date;
  action?: string;
  searchTerm?: string;
}

export class ExportService {
  static downloadFile(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

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

      const timestamp = dateFormat(new Date(), 'yyyy-MM-dd_HHmm');
      const filename = `audit_logs_${timestamp}.${format}`;

      if (format === 'json') {
        const data = await response.json();
        this.downloadFile(
          JSON.stringify(data, null, 2),
          filename,
          'application/json'
        );
      } else {
        const text = await response.text();
        this.downloadFile(
          text,
          filename,
          'text/csv'
        );
      }
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }
} 