import { AuditLog, AuditAction } from '../entities/AuditLog';
import { Employee } from '../entities/Employee';
import { createAuditLog } from '../services/auditService';
import { AuthAuditService } from '../auth/services/auditService';
import AppDataSource from '../db/connection';
import { UserRole } from '../entities/Employee';

describe('Audit System', () => {
  let testEmployee: Employee;

  beforeAll(async () => {
    await AppDataSource.initialize();
    
    // Create test employee
    const employeeRepo = AppDataSource.getRepository(Employee);
    testEmployee = await employeeRepo.save({
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      password_hash: 'test',
      role: UserRole.EMPLOYEE,
      hire_date: new Date(),
      status: 'active'
    } as Employee);
  });

  afterAll(async () => {
    // Cleanup
    await AppDataSource.getRepository(Employee).delete({ id: testEmployee.id });
    await AppDataSource.destroy();
  });

  it('should create audit log with required metadata', async () => {
    const log = await createAuditLog({
      actor: testEmployee,
      target: testEmployee,
      action: AuditAction.LOGIN,
      metadata: {
        reason: 'Testing'
      },
      notes: 'Test audit log'
    });

    expect(log).toBeDefined();
    expect(log.metadata.ip).toBe('unknown');
    expect(log.metadata.userAgent).toBe('unknown');
    expect(log.metadata.reason).toBe('Testing');
  });

  it('should retrieve audit logs with filters', async () => {
    const logs = await AuthAuditService.getLogs({
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      action: AuditAction.LOGIN,
      searchTerm: 'test'
    });

    expect(Array.isArray(logs)).toBe(true);
    logs.forEach(log => {
      expect(log.action).toBe(AuditAction.LOGIN);
      expect(log.metadata.ip).toBeDefined();
      expect(log.metadata.userAgent).toBeDefined();
    });
  });
}); 