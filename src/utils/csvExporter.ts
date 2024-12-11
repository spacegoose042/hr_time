import { Parser } from 'json2csv';
import { TimeEntry } from '../entities/TimeEntry';

interface TimeEntryCSV {
  id: string;
  employee_name: string;
  employee_email: string;
  employee_role: string;
  clock_in: string;
  clock_out: string;
  hours: number;
  status: string;
  notes: string;
  date: string;
  week_number: number;
  month: string;
  year: number;
}

export const convertTimeEntriesToCSV = (entries: TimeEntry[]): string => {
  const fields = [
    { label: 'ID', value: 'id' },
    { label: 'Employee Name', value: 'employee_name' },
    { label: 'Employee Email', value: 'employee_email' },
    { label: 'Employee Role', value: 'employee_role' },
    { label: 'Date', value: 'date' },
    { label: 'Week Number', value: 'week_number' },
    { label: 'Month', value: 'month' },
    { label: 'Year', value: 'year' },
    { label: 'Clock In', value: 'clock_in' },
    { label: 'Clock Out', value: 'clock_out' },
    { label: 'Hours', value: 'hours' },
    { label: 'Status', value: 'status' },
    { label: 'Notes', value: 'notes' }
  ];

  const csvData: TimeEntryCSV[] = entries.map(entry => {
    const clockInDate = new Date(entry.clock_in);
    const hours = entry.clock_out 
      ? (new Date(entry.clock_out).getTime() - clockInDate.getTime()) / (1000 * 60 * 60)
      : 0;

    const getWeekNumber = (d: Date): number => {
      const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
      const pastDaysOfYear = (d.getTime() - firstDayOfYear.getTime()) / 86400000;
      return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    };

    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return {
      id: entry.id,
      employee_name: `${entry.employee.first_name} ${entry.employee.last_name}`,
      employee_email: entry.employee.email,
      employee_role: entry.employee.role,
      date: clockInDate.toLocaleDateString(),
      week_number: getWeekNumber(clockInDate),
      month: months[clockInDate.getMonth()],
      year: clockInDate.getFullYear(),
      clock_in: clockInDate.toLocaleString(),
      clock_out: entry.clock_out ? new Date(entry.clock_out).toLocaleString() : '',
      hours: Number(hours.toFixed(2)),
      status: entry.status,
      notes: entry.notes || ''
    };
  });

  // Calculate summaries
  const summaries = entries.reduce((acc, entry) => {
    const hours = entry.clock_out 
      ? (new Date(entry.clock_out).getTime() - new Date(entry.clock_in).getTime()) / (1000 * 60 * 60)
      : 0;

    // Group by employee
    if (!acc.employeeHours[entry.employee.id]) {
      acc.employeeHours[entry.employee.id] = {
        name: `${entry.employee.first_name} ${entry.employee.last_name}`,
        hours: 0
      };
    }
    acc.employeeHours[entry.employee.id].hours += hours;

    // Group by status
    if (!acc.statusCounts[entry.status]) {
      acc.statusCounts[entry.status] = 0;
    }
    acc.statusCounts[entry.status]++;

    // Total hours
    acc.totalHours += hours;

    return acc;
  }, {
    employeeHours: {} as Record<string, { name: string; hours: number }>,
    statusCounts: {} as Record<string, number>,
    totalHours: 0
  });

  // Create the CSV content
  const parser = new Parser({ fields });
  let csvContent = parser.parse(csvData);

  // Add summary section
  csvContent += '\n\nSUMMARY\n';
  csvContent += 'Total Hours,Total Entries\n';
  csvContent += `${summaries.totalHours.toFixed(2)},${entries.length}\n\n`;

  // Add employee summary
  csvContent += 'HOURS BY EMPLOYEE\n';
  csvContent += 'Employee Name,Total Hours\n';
  Object.values(summaries.employeeHours).forEach(({ name, hours }) => {
    csvContent += `${name},${hours.toFixed(2)}\n`;
  });

  // Add status summary
  csvContent += '\nENTRIES BY STATUS\n';
  csvContent += 'Status,Count\n';
  Object.entries(summaries.statusCounts).forEach(([status, count]) => {
    csvContent += `${status},${count}\n`;
  });

  return csvContent;
}; 