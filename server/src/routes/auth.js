import { Router } from 'express';
import { register, login, me } from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, registerSchema } from '../validators/schemas.js';
import { authLimiter, registerLimiter } from '../middleware/rateLimit.js';
import { requireAuth } from '../middleware/auth.js';
import { registrationDocumentUpload, parseRegistrationPayload } from '../middleware/upload.js';

const router = Router();

router.post(
  '/register',
  registerLimiter,
  registrationDocumentUpload,
  parseRegistrationPayload,
  validate(registerSchema),
  register
);
router.post('/login', authLimiter, validate(loginSchema), login);
router.get('/me', requireAuth, me);

export default router;
