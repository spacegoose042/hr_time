import { compare } from 'bcryptjs';
import AppDataSource from '../../db/connection';
import { PasswordHistory } from '../../entities/PasswordHistory';
import { MoreThanOrEqual } from 'typeorm';

export class PasswordHistoryService {
  private static readonly HISTORY_LIMIT = 5; // Number of previous passwords to check
  private static readonly HISTORY_DAYS = 365; // Don't reuse passwords within a year

  static async addToHistory(employeeId: string, passwordHash: string): Promise<void> {
    const historyRepo = AppDataSource.getRepository(PasswordHistory);

    // Create new history entry
    await historyRepo.save({
      employeeId,
      password_hash: passwordHash
    });

    // Remove old entries beyond the limit
    const oldEntries = await historyRepo.find({
      where: { employeeId },
      order: { created_at: 'DESC' },
      skip: this.HISTORY_LIMIT
    });

    if (oldEntries.length > 0) {
      await historyRepo.remove(oldEntries);
    }
  }

  static async isPasswordReused(
    employeeId: string,
    newPassword: string
  ): Promise<boolean> {
    const historyRepo = AppDataSource.getRepository(PasswordHistory);
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - this.HISTORY_DAYS);

    // Get recent password history
    const recentPasswords = await historyRepo.find({
      where: {
        employeeId,
        created_at: MoreThanOrEqual(minDate)
      },
      take: this.HISTORY_LIMIT,
      order: { created_at: 'DESC' }
    });

    // Check if new password matches any recent passwords
    for (const entry of recentPasswords) {
      if (await compare(newPassword, entry.password_hash)) {
        return true;
      }
    }

    return false;
  }
} 