import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { LoginDto, RegisterDto } from '../dto/auth.dto';
import { ApiError } from '../../middleware/errorHandler';

export class AuthController {
  constructor(private authService: AuthService) {}

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const loginDto: LoginDto = req.body;
      const result = await this.authService.login(loginDto);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const registerDto: RegisterDto = req.body;
      const result = await this.authService.register(registerDto);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // @ts-ignore - we'll add user to request type later
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError('Unauthorized', 401);
      }
      const user = await this.authService.getUserById(userId);
      res.json(user);
    } catch (error) {
      next(error);
    }
  };
} 