import { Repository } from 'typeorm';
import { Employee } from '../../entities/Employee';
import { LoginDto, RegisterDto } from '../dto/auth.dto';
import { compare, hash } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { ApiError } from '../../middleware/errorHandler';
import AppDataSource from '../../db/connection';

export class AuthService {
  private employeeRepository: Repository<Employee>;

  constructor() {
    this.employeeRepository = AppDataSource.getRepository(Employee);
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const employee = await this.employeeRepository.findOne({ where: { email } });
    if (!employee) {
      throw new ApiError('Invalid credentials', 401);
    }

    const isPasswordValid = await compare(password, employee.password_hash);
    if (!isPasswordValid) {
      throw new ApiError('Invalid credentials', 401);
    }

    const token = this.generateToken(employee);

    return {
      token,
      employee: this.sanitizeEmployee(employee)
    };
  }

  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName } = registerDto;

    const existingEmployee = await this.employeeRepository.findOne({ where: { email } });
    if (existingEmployee) {
      throw new ApiError('Email already in use', 400);
    }

    const passwordHash = await hash(password, 10);

    const employee = this.employeeRepository.create({
      email,
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      role: 'employee',
      status: 'active',
      hire_date: new Date()
    });

    await this.employeeRepository.save(employee);

    const token = this.generateToken(employee);

    return {
      token,
      employee: this.sanitizeEmployee(employee)
    };
  }

  async getUserById(id: string) {
    const employee = await this.employeeRepository.findOne({ where: { id } });
    if (!employee) {
      throw new ApiError('Employee not found', 404);
    }
    return this.sanitizeEmployee(employee);
  }

  private generateToken(employee: Employee): string {
    return sign(
      {
        id: employee.id,
        email: employee.email,
        role: employee.role
      },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
  }

  private sanitizeEmployee(employee: Employee) {
    const { password_hash, ...sanitizedEmployee } = employee;
    return sanitizedEmployee;
  }
} 