import fs from 'node:fs/promises';
import Admin from '../models/Admin.js';
import Hospital from '../models/Hospital.js';
import Notification from '../models/Notification.js';
import { asyncHandler, httpError } from '../utils/http.js';
import { issueToken } from '../middleware/auth.js';
import { broadcastHospitalUpdate } from '../services/realtime.js';
import { resolveRegistrationDocument, removeRegistrationDocument } from '../services/registrationStorage.js';
import { serializeHospitalForAdmin } from '../services/serializers.js';
import {
  createAdminNotification,
  listAdminNotifications,
  unreadNotificationFilter,
} from '../services/notifications.js';
import { VERIFIED_WINDOW_DAYS, BED_KEYS } from '../constants.js';

const MS_DAY = 24 * 60 * 60 * 1000;
const APPLICANT_FIELDS = 'name email designation phone';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const sumBeds = (hospitals, field) =>
  hospitals.reduce(
    (total, hospital) =>
      total +
      BED_KEYS.reduce((inner, key) => inner + (Number(hospital.beds?.[key]?.[field]) || 0), 0),
    0
  );

async function registrationCounts() {
  const [rows, unregistered] = await Promise.all([
    Hospital.aggregate([
      { $match: { 'registration.document': { $ne: null } } },
      { $group: { _id: '$registration.status', count: { $sum: 1 } } },
    ]),
    Hospital.countDocuments({ registration: null }),
  ]);

  const counts = { pending: 0, verified: 0, rejected: 0, unregistered };
  for (const row of rows) {
    if (row._id in counts) counts[row._id] = row.count;
  }
  counts.all = counts.pending + counts.verified + counts.rejected;
  return counts;
}

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body;
  const admin = await Admin.findOne({ email }).select('+passwordHash');

  if (!admin || !(await admin.comparePassword(password))) {
    throw httpError(401, 'Invalid email or password');
  }
  if (admin.role !== 'super_admin') {
    throw httpError(403, 'This account cannot access the control room');
  }

  res.json({
    success: true,
    token: issueToken(admin),
    data: { admin: admin.toSafeJSON() },
  });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { admin: req.admin.toSafeJSON() } });
});

export const getOverview = asyncHandler(async (req, res) => {
  const [hospitals, counts, recent, unreadNotifications] = await Promise.all([
    Hospital.find()
      .select('beds oxygenStatus contacts.lastVerified')
      .lean(),
    registrationCounts(),
    Hospital.find({ 'registration.document': { $ne: null } })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('adminId', APPLICANT_FIELDS)
      .lean(),
    Notification.countDocuments(unreadNotificationFilter(req.admin._id)),
  ]);

  const verifiedSince = Date.now() - VERIFIED_WINDOW_DAYS * MS_DAY;

  res.json({
    success: true,
    data: {
      stats: {
        hospitals: hospitals.length,
        pending: counts.pending,
        verified: counts.verified,
        rejected: counts.rejected,
        unregistered: counts.unregistered,
        bedsTotal: sumBeds(hospitals, 'total'),
        bedsAvailable: sumBeds(hospitals, 'available'),
        oxygenReady: hospitals.filter((hospital) => hospital.oxygenStatus === 'available').length,
        contactsVerified: hospitals.filter((hospital) => {
          const lastVerified = hospital.contacts?.lastVerified;
          return Boolean(lastVerified && new Date(lastVerified).getTime() >= verifiedSince);
        }).length,
        unreadNotifications,
      },
      recentRegistrations: recent.map((hospital) =>
        serializeHospitalForAdmin(hospital, hospital.adminId)
      ),
      counts,
      generatedAt: new Date().toISOString(),
    },
  });
});

export const listRegistrations = asyncHandler(async (req, res) => {
  const { status } = req.validated.query;
  const filter = { 'registration.document': { $ne: null } };
  if (status !== 'all') filter['registration.status'] = status;

  const [hospitals, counts] = await Promise.all([
    Hospital.find(filter)
      .sort({ updatedAt: -1 })
      .limit(200)
      .populate('adminId', APPLICANT_FIELDS)
      .lean(),
    registrationCounts(),
  ]);

  res.json({
    success: true,
    data: hospitals.map((hospital) => serializeHospitalForAdmin(hospital, hospital.adminId)),
    meta: { count: hospitals.length, status, counts },
  });
});

export const reviewRegistration = asyncHandler(async (req, res) => {
  const { decision, note = '' } = req.validated.body;
  const hospital = await Hospital.findById(req.params.id).populate('adminId', APPLICANT_FIELDS);

  if (!hospital) throw httpError(404, 'Hospital not found');
  if (!hospital.registration?.document) {
    throw httpError(400, 'This hospital has no registration certificate to review');
  }

  const approved = decision === 'approve';

  if (!approved) {
    try {
      await createAdminNotification({
        type: 'registration_rejected',
        title: 'Hospital registration rejected',
        message: `${hospital.name} (${hospital.city}) was rejected and removed. Reason: ${note}`,
        hospital,
        actor: req.admin.name,
      });
    } catch (error) {
      console.error('[notifications] failed to record review:', error.message);
    }

    await removeRegistrationDocument(hospital.registration.document.filename);
    if (hospital.adminId) {
      await Admin.deleteOne({ _id: hospital.adminId._id || hospital.adminId });
    }
    await hospital.deleteOne();

    res.json({
      success: true,
      data: null,
      message: 'Hospital registration rejected and removed',
    });
    return;
  }

  hospital.registration.status = 'verified';
  hospital.registration.reviewedAt = new Date();
  hospital.registration.reviewedBy = req.admin._id;
  hospital.registration.note = note;
  await hospital.save();

  try {
    await createAdminNotification({
      type: 'registration_approved',
      title: 'Hospital registration approved',
      message: `${hospital.name} (${hospital.city}) cleared review. Certificate marked verified.`,
      hospital,
      actor: req.admin.name,
    });
  } catch (error) {
    console.error('[notifications] failed to record review:', error.message);
  }

  res.json({
    success: true,
    data: serializeHospitalForAdmin(hospital, hospital.adminId),
    message: 'Hospital registration approved',
  });
});

export const getRegistrationDocument = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findById(req.params.id).lean();
  const document = hospital?.registration?.document;
  if (!document?.filename) throw httpError(404, 'No registration document on file');

  const filePath = resolveRegistrationDocument(document.filename);
  if (!filePath) throw httpError(404, 'Registration document path is invalid');
  try {
    await fs.access(filePath);
  } catch {
    throw httpError(404, 'Registration document file is missing');
  }

  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.download(filePath, document.originalName);
});

export const listHospitals = asyncHandler(async (req, res) => {
  const { q, status } = req.validated.query;
  const filter = {};

  if (q) {
    const pattern = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: pattern }, { city: pattern }, { pincode: pattern }];
  }

  if (status !== 'all') {
    if (status === 'unregistered') {
      filter.registration = null;
    } else {
      filter['registration.status'] = status;
      filter['registration.document'] = { $ne: null };
    }
  }

  const [hospitals, counts] = await Promise.all([
    Hospital.find(filter)
      .sort({ updatedAt: -1 })
      .limit(200)
      .populate('adminId', APPLICANT_FIELDS)
      .lean(),
    registrationCounts(),
  ]);

  res.json({
    success: true,
    data: hospitals.map((hospital) => serializeHospitalForAdmin(hospital, hospital.adminId)),
    meta: { count: hospitals.length, status, query: q || '', counts },
  });
});

export const verifyContacts = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findById(req.params.id).populate('adminId', APPLICANT_FIELDS);
  if (!hospital) throw httpError(404, 'Hospital not found');

  hospital.contacts.lastVerified = new Date();
  await hospital.save();
  broadcastHospitalUpdate(hospital);

  try {
    await createAdminNotification({
      type: 'contacts_verified',
      title: 'Contact details verified',
      message: `${hospital.name} (${hospital.city}) contact lines were verified by ${req.admin.name}.`,
      hospital,
      actor: req.admin.name,
    });
  } catch (error) {
    console.error('[notifications] failed to record verification:', error.message);
  }

  res.json({
    success: true,
    data: serializeHospitalForAdmin(hospital, hospital.adminId),
    message: 'Contact details marked verified',
  });
});

export const listNotifications = asyncHandler(async (req, res) => {
  const { limit } = req.validated.query;
  const [items, unread] = await Promise.all([
    listAdminNotifications(req.admin._id, limit),
    Notification.countDocuments(unreadNotificationFilter(req.admin._id)),
  ]);

  res.json({ success: true, data: items, meta: { unread } });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { readBy: req.admin._id } },
    { new: true }
  );
  if (!notification) throw httpError(404, 'Notification not found');

  const unread = await Notification.countDocuments(unreadNotificationFilter(req.admin._id));
  res.json({ success: true, data: notification.toJSONPayload(req.admin._id), meta: { unread } });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(unreadNotificationFilter(req.admin._id), {
    $addToSet: { readBy: req.admin._id },
  });
  res.json({ success: true, meta: { unread: 0 } });
});
