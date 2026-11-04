import rateLimit from 'express-rate-limit';
import config from '../config/env.js';

const skip = () => config.nodeEnv === 'test';

const base = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip,
  message: { success: false, message: 'Too many requests. Please try again in a few minutes.' },
};

export const apiLimiter = rateLimit({ ...base, windowMs: 15 * 60 * 1000, limit: 900 });

export const authLimiter = rateLimit({ ...base, windowMs: 15 * 60 * 1000, limit: 25 });

export const registerLimiter = rateLimit({ ...base, windowMs: 60 * 60 * 1000, limit: 15 });

export const writeLimiter = rateLimit({ ...base, windowMs: 15 * 60 * 1000, limit: 300 });
