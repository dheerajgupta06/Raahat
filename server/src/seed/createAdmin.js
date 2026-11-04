import { connectDB, disconnectDB } from '../config/db.js';
import Admin from '../models/Admin.js';

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME?.trim() || 'Raahat Control Room';

if (!email || !password || password.length < 8) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (minimum 8 characters) before running create-admin.');
  process.exit(1);
}

await connectDB();

const existing = await Admin.findOne({ email }).select('+passwordHash');
if (existing) {
  existing.name = name;
  existing.role = 'super_admin';
  existing.hospital = null;
  existing.passwordHash = password;
  await existing.save();
  console.log(`[admin] Updated control-room account ${email}`);
} else {
  await Admin.create({
    name,
    email,
    passwordHash: password,
    designation: 'Network operations',
    role: 'super_admin',
    hospital: null,
  });
  console.log(`[admin] Created control-room account ${email}`);
}

await disconnectDB();
