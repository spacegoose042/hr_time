import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { AuthService } from '../services/authService';
import { validateRequest } from '../../middleware/validateRequest';
import { loginSchema, registerSchema } from '../validators/authValidators';
import { requireAuth } from '../../middleware/authMiddleware';

const router = Router();
const authService = new AuthService();
const authController = new AuthController(authService);

router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/register', validateRequest(registerSchema), authController.register);
router.get('/me', requireAuth, authController.getCurrentUser);

export default router; 