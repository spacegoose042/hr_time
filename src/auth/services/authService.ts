import { Repository } from 'typeorm';
import { Employee } from '../../entities/Employee';
import { LoginDto, RegisterDto } from '../dto/auth.dto';
import { compare, hash } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { ApiError } from '../../middleware/errorHandler';
import AppDataSource from '../../db/connection';
import { UserRole } from '../roles/roles';

export class AuthService {
  private employeeRepository: Repository<Employee>;

  constructor() {
    this.employeeRepository = AppDataSource.getRepository(Employee);
  }

  async register(registerDto: RegisterDto) {
    try {
      console.log('Starting registration for:', registerDto.email);
      const { email, password, firstName, lastName } = registerDto;

      console.log('Checking for existing employee');
      const existingEmployee = await this.employeeRepository.findOne({ where: { email } });
      if (existingEmployee) {
        throw new ApiError('Email already in use', 400);
      }

      console.log('Hashing password');
      const passwordHash = await hash(password, 10);

      console.log('Creating employee');
      const employee = this.employeeRepository.create({
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        role: UserRole.EMPLOYEE,
        status: 'active',
        hire_date: new Date()
      });

      console.log('Saving employee');
      await this.employeeRepository.save(employee);

      console.log('Generating token');
      const token = this.generateToken(employee);

      console.log('Registration successful');
      return {
        token,
        employee: this.sanitizeEmployee(employee)
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
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
      { expiresIn: '24h' }
    );
  }

  private sanitizeEmployee(employee: Employee) {
    const { password_hash, ...sanitizedEmployee } = employee;
    return sanitizedEmployee;
  }
} 