import Notification from '../models/Notification.js';
import { emitToAdmins } from './realtime.js';

export async function createAdminNotification({ type, title, message, hospital, actor = '' }) {
  const notification = await Notification.create({
    audience: 'admin',
    type,
    title,
    message,
    hospital: hospital ? hospital._id : null,
    hospitalName: hospital?.name || '',
    actor,
  });

  const payload = notification.toJSONPayload();
  emitToAdmins('admin:notification', payload);
  return payload;
}

export async function listAdminNotifications(adminId, limit = 30) {
  const notifications = await Notification.find({ audience: 'admin' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return notifications.map((item) => ({
    id: item._id.toString(),
    type: item.type,
    title: item.title,
    message: item.message,
    hospitalId: item.hospital ? item.hospital.toString() : null,
    hospitalName: item.hospitalName,
    actor: item.actor,
    read: (item.readBy || []).some((id) => id.toString() === adminId.toString()),
    createdAt: new Date(item.createdAt).toISOString(),
  }));
}

export function unreadNotificationFilter(adminId) {
  return { audience: 'admin', readBy: { $ne: adminId } };
}
