import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import Admin from '../models/Admin.js';
import { asyncHandler, httpError } from '../utils/http.js';

async function authenticate(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) throw httpError(401, 'Authentication required');

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw httpError(401, 'Session expired. Please sign in again.');
  }

  const admin = await Admin.findById(payload.sub);
  if (!admin) throw httpError(401, 'Account no longer exists');
  return admin;
}

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const admin = await authenticate(req);
  if (!admin.hospital) throw httpError(401, 'Account is not linked to a hospital');
  req.admin = admin;
  next();
});

export const requireSuperAdmin = asyncHandler(async (req, _res, next) => {
  const admin = await authenticate(req);
  if (admin.role !== 'super_admin') throw httpError(403, 'Control room access required');
  req.admin = admin;
  next();
});

export function issueToken(admin) {
  const hospitalId = admin.hospital?._id ?? admin.hospital;
  return jwt.sign(
    { sub: admin._id.toString(), hid: hospitalId ? hospitalId.toString() : undefined },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}
