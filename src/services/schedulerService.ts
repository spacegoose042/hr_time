import { Employee } from '../entities/Employee';
import { TimeEntry } from '../entities/TimeEntry';
import { UserRole } from '../auth/roles/roles';
import AppDataSource from '../db/connection';
import { LessThan, IsNull, Not } from 'typeorm';
import { sendWeeklySummary, sendOverdueApprovalsReminder } from './emailService';

export const sendWeeklyReports = async () => {
  try {
    const employeeRepo = AppDataSource.getRepository(Employee);
    const timeEntryRepo = AppDataSource.getRepository(TimeEntry);

    // Get all managers and admins
    const managers = await employeeRepo.find({
      where: [
        { role: UserRole.MANAGER },
        { role: UserRole.ADMIN }
      ]
    });

    // Calculate date range for the past week
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    for (const manager of managers) {
      // Get all entries for the past week
      const entries = await timeEntryRepo.find({
        where: {
          clock_in: LessThan(endDate),
          clock_out: Not(IsNull()),
          created_at: LessThan(endDate)
        },
        relations: ['employee'],
        order: { clock_in: 'DESC' }
      });

      if (entries.length > 0) {
        await sendWeeklySummary(manager, entries, startDate, endDate);
      }
    }
  } catch (error) {
    console.error('Error sending weekly reports:', error);
  }
};

export const sendOverdueReminders = async () => {
  try {
    const employeeRepo = AppDataSource.getRepository(Employee);
    const timeEntryRepo = AppDataSource.getRepository(TimeEntry);

    // Get all managers and admins
    const managers = await employeeRepo.find({
      where: [
        { role: UserRole.MANAGER },
        { role: UserRole.ADMIN }
      ]
    });

    for (const manager of managers) {
      // Get pending entries older than 24 hours
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);

      const pendingEntries = await timeEntryRepo.find({
        where: {
          status: 'pending',
          clock_out: Not(IsNull()),
          created_at: LessThan(oneDayAgo)
        },
        relations: ['employee'],
        order: { clock_in: 'DESC' }
      });

      if (pendingEntries.length > 0) {
        await sendOverdueApprovalsReminder(manager, pendingEntries);
      }
    }
  } catch (error) {
    console.error('Error sending overdue reminders:', error);
  }
};

// Add this function for testing
export const generateTestWeeklyReport = async () => {
  try {
    const employeeRepo = AppDataSource.getRepository(Employee);
    const timeEntryRepo = AppDataSource.getRepository(TimeEntry);

    // Get all managers and admins
    const managers = await employeeRepo.find({
      where: [
        { role: UserRole.MANAGER },
        { role: UserRole.ADMIN }
      ]
    });

    // Calculate date range for the past week
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    console.log(`Generating reports for ${managers.length} managers...`);
    console.log(`Date range: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`);

    for (const manager of managers) {
      console.log(`Processing report for manager: ${manager.email}`);
      
      // Get all entries for the past week
      const entries = await timeEntryRepo.find({
        where: {
          clock_in: LessThan(endDate),
          clock_out: Not(IsNull()),
          created_at: LessThan(endDate)
        },
        relations: ['employee'],
        order: { clock_in: 'DESC' }
      });

      console.log(`Found ${entries.length} entries for the period`);

      if (entries.length > 0) {
        await sendWeeklySummary(manager, entries, startDate, endDate);
        console.log(`Weekly summary sent to ${manager.email}`);
      }
    }
  } catch (error) {
    console.error('Error generating test weekly report:', error);
  }
}; 