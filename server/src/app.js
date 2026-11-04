import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import config from './config/env.js';
import authRoutes from './routes/auth.js';
import hospitalRoutes from './routes/hospitals.js';
import adminRoutes from './routes/admin.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFound, requestLogger } from './middleware/error.js';
import { dbState, getDbMode } from './config/db.js';
import { isRealtimeReady } from './services/realtime.js';

const isDevOriginAllowed = (origin) => {
  if (config.isProduction) return false;
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin);
};

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    })
  );

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (config.clientOrigins.includes(origin) || isDevOriginAllowed(origin)) {
          return callback(null, true);
        }
        return callback(Object.assign(new Error('Origin not allowed'), { status: 403 }));
      },
      methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(compression());
  app.use(express.json({ limit: '150kb' }));
  app.use(requestLogger);

  app.get('/', (_req, res) => {
    res.json({
      success: true,
      name: 'Raahat API',
      message: 'Emergency me sabse pehle Raahat',
      docs: '/api/health',
    });
  });

  app.get('/api/health', (_req, res) => {
    res.json({
      success: true,
      data: {
        status: 'ok',
        dbState: dbState(),
        dbMode: getDbMode(),
        realtime: isRealtimeReady(),
        time: new Date().toISOString(),
        uptimeSeconds: Math.round(process.uptime()),
      },
    });
  });

  app.use('/api', apiLimiter);
  app.use('/api/auth', authRoutes);
  app.use('/api/hospitals', hospitalRoutes);
  app.use('/api/admin', adminRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
