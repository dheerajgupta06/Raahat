import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import Admin from '../models/Admin.js';
import { serializeHospital } from './serializers.js';

let ioInstance = null;

async function joinAdminRoom(socket) {
  const token = socket.handshake.auth?.token;
  if (!token) return;
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const admin = await Admin.findById(payload.sub).lean();
    if (admin?.role === 'super_admin') {
      socket.join('admins');
      socket.emit('admin:ready', { ok: true, adminId: admin._id.toString() });
    }
  } catch {
    // Invalid tokens stay on the public channel only.
  }
}

export function initRealtime(io) {
  ioInstance = io;
  io.on('connection', (socket) => {
    socket.join('public');
    socket.emit('network:hello', { ok: true, serverTime: new Date().toISOString() });
    joinAdminRoom(socket);
  });
}

/** Pushes a notification to every connected control-room socket. */
export function emitToAdmins(event, payload) {
  if (!ioInstance) return;
  try {
    ioInstance.to('admins').emit(event, payload);
  } catch (error) {
    console.error('[socket] failed to emit admin event:', error.message);
  }
}

/** Broadcasts a sanitized hospital snapshot to every connected public client. */
export function broadcastHospitalUpdate(hospital) {
  if (!ioInstance) return;
  try {
    const payload = serializeHospital(hospital);
    ioInstance.to('public').emit('hospital:update', payload);
  } catch (error) {
    console.error('[socket] failed to broadcast hospital update:', error.message);
  }
}

export function isRealtimeReady() {
  return Boolean(ioInstance);
}
