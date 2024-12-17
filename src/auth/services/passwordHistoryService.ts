import { Repository } from 'typeorm';
import { compare } from 'bcryptjs';
import { PasswordHistory } from '../../entities/PasswordHistory';
import AppDataSource from '../../db/connection';

const passwordHistoryRepo: Repository<PasswordHistory> = AppDataSource.getRepository(PasswordHistory);

export const getPasswordHistory = async (employee_id: string): Promise<PasswordHistory[]> => {
    return await passwordHistoryRepo.find({
        where: {
            employee: { id: employee_id }
        },
        order: {
            created_at: 'DESC'
        },
        relations: ['employee']
    });
};

export const addPasswordHistory = async (employee_id: string, password_hash: string): Promise<PasswordHistory> => {
    const newHistory = passwordHistoryRepo.create({
        employee: { id: employee_id },
        password_hash
    });
    return await passwordHistoryRepo.save(newHistory);
};

export const isPasswordReused = async (employee_id: string, newPassword: string): Promise<boolean> => {
    const recentPasswords = await passwordHistoryRepo.find({
        where: {
            employee: { id: employee_id }
        },
        order: {
            created_at: 'DESC'
        },
        take: 5 // Check last 5 passwords
    });

    for (const history of recentPasswords) {
        if (await compare(newPassword, history.password_hash)) {
            return true;
        }
    }

    return false;
};

export const cleanupOldPasswords = async (employee_id: string): Promise<void> => {
    const oldPasswords = await passwordHistoryRepo.find({
        where: {
            employee: { id: employee_id }
        },
        order: {
            created_at: 'DESC'
        },
        skip: 5 // Keep only last 5 passwords
    });

    if (oldPasswords.length > 0) {
        await passwordHistoryRepo.remove(oldPasswords);
    }
}; 
