import nodemailer from 'nodemailer';
import { TimeEntry } from '../entities/TimeEntry';
import { Employee } from '../entities/Employee';
import { convertTimeEntriesToCSV } from '../utils/csvExporter';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const sendTimeEntryStatusUpdate = async (
  timeEntry: TimeEntry,
  status: 'approved' | 'rejected',
  managerNote?: string
) => {
  const employee = timeEntry.employee;
  const subject = `Time Entry ${status.toUpperCase()}`;
  const html = `
    <h2>Time Entry ${status.toUpperCase()}</h2>
    <p>Your time entry has been ${status}.</p>
    <h3>Details:</h3>
    <ul>
      <li>Date: ${new Date(timeEntry.clock_in).toLocaleDateString()}</li>
      <li>Clock In: ${new Date(timeEntry.clock_in).toLocaleString()}</li>
      <li>Clock Out: ${timeEntry.clock_out ? new Date(timeEntry.clock_out).toLocaleString() : 'N/A'}</li>
      ${managerNote ? `<li>Manager Note: ${managerNote}</li>` : ''}
    </ul>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: employee.email,
    subject,
    html
  });
};

export const sendWeeklySummary = async (
  manager: Employee,
  entries: TimeEntry[],
  startDate: Date,
  endDate: Date
) => {
  const csv = convertTimeEntriesToCSV(entries);
  const subject = `Weekly Time Entries Summary (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`;
  const html = `
    <h2>Weekly Time Entries Summary</h2>
    <p>Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</p>
    <p>Manager: ${manager.first_name} ${manager.last_name}</p>
    <p>Total Entries: ${entries.length}</p>
    <p>Please find attached the detailed report.</p>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: manager.email,
    subject,
    html,
    attachments: [
      {
        filename: 'time-entries.csv',
        content: csv
      }
    ]
  });
};

export const sendOverdueApprovalsReminder = async (
  manager: Employee,
  pendingEntries: TimeEntry[]
) => {
  const subject = 'Pending Time Entries Require Your Approval';
  const html = `
    <h2>Pending Time Entries</h2>
    <p>You have ${pendingEntries.length} time entries pending approval:</p>
    <ul>
      ${pendingEntries.map(entry => `
        <li>
          ${entry.employee.first_name} ${entry.employee.last_name} - 
          ${new Date(entry.clock_in).toLocaleDateString()}
        </li>
      `).join('')}
    </ul>
    <p>Please review and approve/reject these entries at your earliest convenience.</p>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: manager.email,
    subject,
    html
  });
}; 