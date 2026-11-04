import { Router } from 'express';
import {
  getNearby,
  getStats,
  getHospital,
  getContacts,
  getMe,
  getRegistrationDocument,
  updateBeds,
  updateOxygen,
  updateContacts,
  verifyContacts,
  updateProfile,
} from '../controllers/hospitalController.js';
import { validate } from '../middleware/validate.js';
import {
  coordsQuerySchema,
  nearbyQuerySchema,
  bedsPatchSchema,
  oxygenPatchSchema,
  contactsPatchSchema,
  profilePatchSchema,
} from '../validators/schemas.js';
import { requireAuth } from '../middleware/auth.js';
import { writeLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.get('/nearby', validate(nearbyQuerySchema, 'query'), getNearby);
router.get('/stats', getStats);
router.get('/me', requireAuth, getMe);
router.get('/me/registration', requireAuth, getRegistrationDocument);

router.get('/:id/contacts', getContacts);
router.get('/:id', validate(coordsQuerySchema, 'query'), getHospital);

router.put('/:id/beds', requireAuth, writeLimiter, validate(bedsPatchSchema), updateBeds);
router.put('/:id/oxygen', requireAuth, writeLimiter, validate(oxygenPatchSchema), updateOxygen);
router.put('/:id/contacts', requireAuth, writeLimiter, validate(contactsPatchSchema), updateContacts);
router.put('/:id/profile', requireAuth, writeLimiter, validate(profilePatchSchema), updateProfile);
router.post('/:id/contacts/verify', requireAuth, writeLimiter, verifyContacts);

export default router;
