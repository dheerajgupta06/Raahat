import mongoose from 'mongoose';
import config from './env.js';
import { seedDatabase } from '../seed/seedDb.js';

let memoryServer = null;
let mode = 'mongo';

/**
 * Connects to MongoDB. In non-production environments without MONGODB_URI,
 * an ephemeral in-memory MongoDB is started so the project runs with zero setup.
 */
export async function connectDB() {
  if (mongoose.connection.readyState === 1) return mode;

  if (config.mongoUri) {
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 12000,
      autoIndex: !config.isProduction,
    });
    mode = 'mongo';
    return mode;
  }

  if (config.isProduction) {
    throw new Error('MONGODB_URI is required in production');
  }

  const { MongoMemoryServer } = await import('mongodb-memory-server');
  memoryServer = await MongoMemoryServer.create({
    instance: { dbName: 'raahat' },
  });
  await mongoose.connect(memoryServer.getUri(), { dbName: 'raahat' });
  mode = 'memory';
  return mode;
}

export async function maybeSeed() {
  if (!config.autoSeed) return null;
  const { default: Hospital } = await import('../models/Hospital.js');
  const count = await Hospital.estimatedDocumentCount();
  if (count > 0) return null;
  return seedDatabase({ reset: false });
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}

export function getDbMode() {
  return mode;
}

export function dbState() {
  return mongoose.connection.readyState;
}
