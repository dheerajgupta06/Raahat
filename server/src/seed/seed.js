import { connectDB, disconnectDB, getDbMode } from '../config/db.js';
import { seedDatabase } from './seedDb.js';

const mode = await connectDB();
const result = await seedDatabase({ reset: true });

console.log(`[seed] ${result.hospitals} demo hospitals and ${result.admins} demo admins written.`);
console.log(`[seed] Demo hospital login: ${result.demoEmail} / ${result.demoPassword}`);
console.log(`[seed] Demo control-room login: ${result.controlEmail} / ${result.demoPassword}`);

if (mode === 'memory') {
  console.log('[seed] Database is in-memory, so this data is discarded when the process exits.');
  console.log('[seed] Set MONGODB_URI to seed MongoDB Atlas or a local mongod instance.');
}

await disconnectDB();
