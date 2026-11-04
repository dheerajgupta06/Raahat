import Hospital from '../models/Hospital.js';
import Admin from '../models/Admin.js';
import { asyncHandler, httpError } from '../utils/http.js';
import { issueToken } from '../middleware/auth.js';
import { serializeHospitalForOwner } from '../services/serializers.js';
import { broadcastHospitalUpdate } from '../services/realtime.js';
import { createAdminNotification } from '../services/notifications.js';
import { saveRegistrationDocument, removeRegistrationDocument } from '../services/registrationStorage.js';

export const register = asyncHandler(async (req, res) => {
  const { admin: adminInput, hospital: hospitalInput } = req.validated.body;

  if (!req.file) {
    throw httpError(400, 'Upload the hospital registration certificate to continue');
  }

  const existing = await Admin.findOne({ email: adminInput.email }).lean();
  if (existing) throw httpError(409, 'An account with this email already exists');

  let hospital;
  let admin;
  let savedDocument = null;
  try {
    hospital = await Hospital.create({
      name: hospitalInput.name,
      type: hospitalInput.type,
      address: hospitalInput.address,
      city: hospitalInput.city,
      state: hospitalInput.state,
      pincode: hospitalInput.pincode,
      location: { type: 'Point', coordinates: [hospitalInput.lng, hospitalInput.lat] },
      is24x7: hospitalInput.is24x7 ?? true,
      ambulanceAvailable: hospitalInput.ambulanceAvailable ?? true,
      specialties: hospitalInput.specialties,
      contacts: {
        reception: {
          phone: hospitalInput.contacts.reception.phone,
          alternatePhone: hospitalInput.contacts.reception.alternatePhone || '',
          receptionistName: hospitalInput.contacts.reception.receptionistName || '',
          whatsapp: hospitalInput.contacts.reception.whatsapp || '',
          is24x7: hospitalInput.contacts.reception.is24x7 ?? true,
          timings: hospitalInput.contacts.reception.timings || { open: '09:00', close: '21:00' },
        },
        emergencyWard: { phone: hospitalInput.contacts.emergencyWard?.phone || '' },
        ambulance: { phone: hospitalInput.contacts.ambulance?.phone || '' },
        mainLine: { phone: hospitalInput.contacts.mainLine?.phone || '' },
        lastVerified: null,
      },
      lastUpdated: new Date(),
      isDemo: false,
    });

    admin = await Admin.create({
      name: adminInput.name,
      email: adminInput.email,
      passwordHash: adminInput.password,
      designation: adminInput.designation || 'Hospital administrator',
      phone: adminInput.phone || '',
      hospital: hospital._id,
    });

    hospital.adminId = admin._id;
    savedDocument = await saveRegistrationDocument(req.file, hospital._id);
    hospital.registration = { document: savedDocument, status: 'pending', reviewedAt: null };
    await hospital.save();
  } catch (error) {
    if (savedDocument) await removeRegistrationDocument(savedDocument.filename);
    if (admin) await Admin.deleteOne({ _id: admin._id }).catch(() => {});
    if (hospital) await Hospital.deleteOne({ _id: hospital._id }).catch(() => {});
    throw error;
  }

  broadcastHospitalUpdate(hospital);
  try {
    await createAdminNotification({
      type: 'registration_submitted',
      title: 'New hospital registration',
      message: `${hospital.name} (${hospital.city}) submitted a certificate and is waiting for review.`,
      hospital,
      actor: admin.name,
    });
  } catch (error) {
    console.error('[notifications] failed to record registration:', error.message);
  }

  res.status(201).json({
    success: true,
    token: issueToken(admin),
    data: { admin: admin.toSafeJSON(), hospital: serializeHospitalForOwner(hospital) },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body;
  const admin = await Admin.findOne({ email }).select('+passwordHash');

  if (!admin || !(await admin.comparePassword(password))) {
    throw httpError(401, 'Invalid email or password');
  }
  if (!admin.hospital) throw httpError(403, 'This account is not linked to a hospital');

  await admin.populate('hospital');
  const token = issueToken(admin);

  res.json({
    success: true,
    token,
    data: { admin: admin.toSafeJSON(), hospital: serializeHospitalForOwner(admin.hospital) },
  });
});

export const me = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findById(req.admin.hospital);
  if (!hospital) throw httpError(404, 'Hospital not found');
  res.json({
    success: true,
    data: { admin: req.admin.toSafeJSON(), hospital: serializeHospitalForOwner(hospital) },
  });
});
