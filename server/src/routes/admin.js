import { Router } from 'express';
import {
  login,
  me,
  getOverview,
  listRegistrations,
  getRegistrationDocument,
  reviewRegistration,
  listHospitals,
  verifyContacts,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../controllers/adminController.js';
import { validate } from '../middleware/validate.js';
import {
  loginSchema,
  adminReviewSchema,
  adminRegistrationsQuerySchema,
  adminHospitalsQuerySchema,
  notificationsQuerySchema,
} from '../validators/schemas.js';
import { authLimiter, writeLimiter } from '../middleware/rateLimit.js';
import { requireSuperAdmin } from '../middleware/auth.js';

const router = Router();

router.post('/login', authLimiter, validate(loginSchema), login);

router.use(requireSuperAdmin);

router.get('/me', me);
router.get('/overview', getOverview);

router.get('/registrations', validate(adminRegistrationsQuerySchema, 'query'), listRegistrations);
router.get('/registrations/:id/document', getRegistrationDocument);
router.post('/registrations/:id/review', writeLimiter, validate(adminReviewSchema), reviewRegistration);

router.get('/hospitals', validate(adminHospitalsQuerySchema, 'query'), listHospitals);
router.post('/hospitals/:id/verify-contacts', writeLimiter, verifyContacts);

router.get('/notifications', validate(notificationsQuerySchema, 'query'), listNotifications);
router.post('/notifications/read-all', writeLimiter, markAllNotificationsRead);
router.post('/notifications/:id/read', writeLimiter, markNotificationRead);

export default router;
