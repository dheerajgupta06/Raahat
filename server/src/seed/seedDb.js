import bcrypt from 'bcryptjs';
import Hospital from '../models/Hospital.js';
import Admin from '../models/Admin.js';
import { buildSeedHospitals } from './hospitals.data.js';

/**
 * Seeds the fictional Delhi NCR network. Reset removes only demo records,
 * so real registered hospitals are never touched.
 */
export async function seedDatabase({ reset = true } = {}) {
  if (reset) {
    await Hospital.deleteMany({ isDemo: true });
    await Admin.deleteMany({ isDemo: true });
  }

  const entries = buildSeedHospitals();
  const passwordHash = await bcrypt.hash('Raahat@123', 10);
  const controlPasswordHash = await bcrypt.hash('Raahat#Control2026', 10);

  const created = {
    hospitals: 0,
    admins: 0,
    demoEmail: 'demo@raahat.demo',
    demoPassword: 'Raahat@123',
    controlEmail: 'control@raahat.demo',
    controlPassword: 'Raahat#Control2026',
  };

  await Admin.create({
    name: 'Raahat Control Room',
    email: created.controlEmail,
    passwordHash: controlPasswordHash,
    designation: 'Network operations',
    role: 'super_admin',
    hospital: null,
    isDemo: true,
  });

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const hospital = await Hospital.create(entry);

    const admin = await Admin.create({
      name: `${entry.name.split(' ').slice(0, 2).join(' ')} Front Desk`,
      email: index === 0 ? 'demo@raahat.demo' : `hospital${index + 1}@raahat.demo`,
      passwordHash,
      designation: 'Hospital administrator',
      hospital: hospital._id,
      isDemo: true,
    });

    hospital.adminId = admin._id;
    await hospital.save();

    created.hospitals += 1;
    created.admins += 1;
  }

  return created;
}
