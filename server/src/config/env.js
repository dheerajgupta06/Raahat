import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const isProduction = process.env.NODE_ENV === 'production';
const fallbackSecret = 'raahat-dev-only-secret-change-me';

if (isProduction && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production');
}

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction,
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI?.trim() || '',
  jwtSecret: process.env.JWT_SECRET || fallbackSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigins: (process.env.CLIENT_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  autoSeed: process.env.DB_AUTO_SEED !== 'false',
  uploadDir: process.env.UPLOAD_DIR?.trim() || path.resolve(__dirname, '../../uploads'),
  usingFallbackSecret: !process.env.JWT_SECRET,
};

export default config;
