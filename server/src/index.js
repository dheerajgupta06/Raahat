import http from 'node:http';
import { Server } from 'socket.io';
import config from './config/env.js';
import { connectDB, maybeSeed, disconnectDB, getDbMode } from './config/db.js';
import { createApp } from './app.js';
import { initRealtime } from './services/realtime.js';

async function bootstrap() {
  const mode = await connectDB();
  const seedResult = await maybeSeed();

  if (mode === 'memory') {
    console.log('[db] In-memory MongoDB active. Data resets on restart - set MONGODB_URI for persistence.');
  }
  if (seedResult) {
    console.log(
      `[seed] Seeded ${seedResult.hospitals} demo hospitals. Staff login: ${seedResult.demoEmail} / ${seedResult.demoPassword} | Control room: ${seedResult.controlEmail} / ${seedResult.demoPassword}`
    );
  }
  if (config.usingFallbackSecret) {
    console.warn('[auth] Development JWT secret in use. Set JWT_SECRET before deploying.');
  }

  const app = createApp();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || config.clientOrigins.includes(origin) || (!config.isProduction && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))) {
          return callback(null, true);
        }
        return callback(new Error('Origin not allowed'));
      },
      methods: ['GET', 'POST'],
    },
  });
  initRealtime(io);

  server.listen(config.port, () => {
    console.log(`[api] Raahat API running on http://localhost:${config.port} (${getDbMode()})`);
  });

  const shutdown = (signal) => {
    console.log(`\n[api] ${signal} received. Shutting down...`);
    io.close();
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 8000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((error) => {
  console.error('[fatal] Failed to start Raahat API:', error);
  process.exit(1);
});
