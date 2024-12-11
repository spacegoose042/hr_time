import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { AuthService } from '../services/authService';
import { validateRequest } from '../../middleware/validateRequest';
import { loginSchema, registerSchema } from '../validators/authValidators';

const router = Router();
const authService = new AuthService();
const authController = new AuthController(authService);

router.post('/register', 
  validateRequest(registerSchema),
  authController.register
);

router.post('/login',
  validateRequest(loginSchema),
  authController.login
);

export default router; 