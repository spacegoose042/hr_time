import { Repository } from 'typeorm';
import { PasswordHistory } from '../entities/PasswordHistory';
import AppDataSource from '../db/connection';

const passwordHistoryRepo: Repository<PasswordHistory> = AppDataSource.getRepository(PasswordHistory);

export const getPasswordHistory = async (employee_id: string): Promise<PasswordHistory[]> => {
    return await passwordHistoryRepo.find({
        where: {
            employee: { id: employee_id }
        },
        order: {
            created_at: 'DESC'
        }
    });
}; 