import mongoose from 'mongoose';
import fs from 'node:fs/promises';
import Hospital from '../models/Hospital.js';
import { asyncHandler, httpError } from '../utils/http.js';
import { resolveRegistrationDocument } from '../services/registrationStorage.js';
import { haversineKm } from '../utils/geo.js';
import { evaluateHospital, sortHospitals } from '../services/matching.js';
import { serializeHospital, serializeHospitalForOwner, sanitizePublicContacts } from '../services/serializers.js';
import { broadcastHospitalUpdate, isRealtimeReady } from '../services/realtime.js';
import { VERIFIED_WINDOW_DAYS } from '../constants.js';

async function findOwnedHospital(req) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw httpError(404, 'Hospital not found');
  const hospital = await Hospital.findById(id);
  if (!hospital) throw httpError(404, 'Hospital not found');
  if (!hospital.adminId || String(hospital.adminId) !== String(req.admin._id)) {
    throw httpError(403, 'You can only manage your own hospital');
  }
  return hospital;
}

export const getNearby = asyncHandler(async (req, res) => {
  const { lat, lng, radius, problem, severity, sort } = req.validated.query;

  // $near uses the 2dsphere index and returns nearest-first; we re-score in JS.
  const hospitals = await Hospital.find({
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: radius * 1000,
      },
    },
  })
    .limit(60)
    .lean();

  const evaluated = hospitals
    .map((hospital) => {
      const [hospitalLng, hospitalLat] = hospital.location.coordinates;
      const distanceKm = haversineKm(lat, lng, hospitalLat, hospitalLng);
      const match = evaluateHospital(hospital, { distanceKm, radiusKm: radius, problem, severity });
      return { ...serializeHospital(hospital), ...match };
    })
    .filter((hospital) => hospital.distanceKm <= radius + 0.05);

  const data = sortHospitals(evaluated, sort || 'nearest');

  res.json({
    success: true,
    data,
    meta: {
      count: data.length,
      center: { lat, lng },
      radiusKm: radius,
      problem,
      severity,
      sort: sort || 'nearest',
      generatedAt: new Date().toISOString(),
    },
  });
});

export const getStats = asyncHandler(async (_req, res) => {
  const hospitals = await Hospital.find(
    {},
    { beds: 1, oxygenStatus: 1, specialties: 1, contacts: 1, is24x7: 1 }
  ).lean();

  let totalBeds = 0;
  let availableBeds = 0;
  let icuAvailable = 0;
  let oxygenReady = 0;
  let verifiedCenters = 0;
  const verifiedMs = VERIFIED_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  for (const hospital of hospitals) {
    totalBeds += hospital.beds?.general?.total || 0;
    totalBeds += hospital.beds?.icu?.total || 0;
    totalBeds += hospital.beds?.oxygen?.total || 0;
    totalBeds += hospital.beds?.ventilator?.total || 0;
    totalBeds += hospital.beds?.emergency?.total || 0;

    availableBeds += hospital.beds?.general?.available || 0;
    availableBeds += hospital.beds?.icu?.available || 0;
    availableBeds += hospital.beds?.oxygen?.available || 0;
    availableBeds += hospital.beds?.ventilator?.available || 0;
    availableBeds += hospital.beds?.emergency?.available || 0;

    icuAvailable += hospital.beds?.icu?.available || 0;
    if (hospital.oxygenStatus !== 'unavailable') oxygenReady += 1;
    const verified = hospital.contacts?.lastVerified ? new Date(hospital.contacts.lastVerified).getTime() : 0;
    if (verified && Date.now() - verified <= verifiedMs) verifiedCenters += 1;
  }

  res.json({
    success: true,
    data: {
      hospitals: hospitals.length,
      totalBeds,
      availableBeds,
      icuAvailable,
      oxygenReady,
      verifiedCenters,
      realtime: isRealtimeReady(),
    },
  });
});

export const getHospital = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw httpError(404, 'Hospital not found');
  const hospital = await Hospital.findById(id).lean();
  if (!hospital) throw httpError(404, 'Hospital not found');

  const { lat, lng } = req.validated?.query || {};
  const extras = {};
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    const distanceKm = haversineKm(lat, lng, hospital.location.coordinates[1], hospital.location.coordinates[0]);
    Object.assign(extras, evaluateHospital(hospital, { distanceKm, radiusKm: 50, problem: 'other', severity: 'serious' }));
  }

  res.json({ success: true, data: serializeHospital(hospital, extras) });
});

export const getContacts = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw httpError(404, 'Hospital not found');
  const hospital = await Hospital.findById(id).lean();
  if (!hospital) throw httpError(404, 'Hospital not found');
  res.json({ success: true, data: sanitizePublicContacts(hospital) });
});

export const getMe = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findById(req.admin.hospital);
  if (!hospital) throw httpError(404, 'Hospital not found');
  res.json({
    success: true,
    data: {
      admin: req.admin.toSafeJSON(),
      hospital: serializeHospitalForOwner(hospital),
    },
  });
});

export const getRegistrationDocument = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findById(req.admin.hospital).lean();
  const document = hospital?.registration?.document;
  if (!document?.filename) throw httpError(404, 'No registration document on file');

  const filePath = resolveRegistrationDocument(document.filename);
  try {
    await fs.access(filePath);
  } catch {
    throw httpError(404, 'Registration document file is missing');
  }

  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.download(filePath, document.originalName);
});

export const updateBeds = asyncHandler(async (req, res) => {
  const hospital = await findOwnedHospital(req);
  const patch = req.validated.body;

  const current = hospital.beds.toObject();
  const merged = { ...current };
  for (const [key, value] of Object.entries(patch)) {
    merged[key] = { ...(current[key] || {}), ...value };
    if (merged[key].available > merged[key].total) {
      throw httpError(400, `Available ${key} beds cannot exceed total ${key} beds`, [
        { path: `beds.${key}.available`, message: 'Available beds cannot exceed total beds' },
      ]);
    }
  }
  hospital.beds = merged;
  hospital.lastUpdated = new Date();
  await hospital.save();

  const data = serializeHospitalForOwner(hospital);
  broadcastHospitalUpdate(hospital);
  res.json({ success: true, data });
});

export const updateOxygen = asyncHandler(async (req, res) => {
  const hospital = await findOwnedHospital(req);
  const { oxygenStatus, oxygenCylinders } = req.validated.body;
  if (oxygenStatus !== undefined) hospital.oxygenStatus = oxygenStatus;
  if (oxygenCylinders !== undefined) hospital.oxygenCylinders = oxygenCylinders;
  hospital.lastUpdated = new Date();
  await hospital.save();

  const data = serializeHospitalForOwner(hospital);
  broadcastHospitalUpdate(hospital);
  res.json({ success: true, data });
});

export const updateContacts = asyncHandler(async (req, res) => {
  const hospital = await findOwnedHospital(req);
  const patch = req.validated.body;
  const current = hospital.contacts.toObject();

  const next = {
    ...current,
    reception: { ...current.reception, timings: { ...current.reception?.timings } },
    emergencyWard: { ...current.emergencyWard },
    ambulance: { ...current.ambulance },
    mainLine: { ...current.mainLine },
  };

  if (patch.reception) {
    next.reception = {
      ...next.reception,
      ...patch.reception,
      timings: { ...next.reception.timings, ...(patch.reception.timings || {}) },
    };
  }
  if (patch.emergencyWard) next.emergencyWard = { ...next.emergencyWard, ...patch.emergencyWard };
  if (patch.ambulance) next.ambulance = { ...next.ambulance, ...patch.ambulance };
  if (patch.mainLine) next.mainLine = { ...next.mainLine, ...patch.mainLine };

  // Any phone change invalidates the previous verification stamp.
  const phoneFields = [
    [current.reception?.phone, next.reception?.phone],
    [current.reception?.whatsapp, next.reception?.whatsapp],
    [current.emergencyWard?.phone, next.emergencyWard?.phone],
    [current.ambulance?.phone, next.ambulance?.phone],
    [current.mainLine?.phone, next.mainLine?.phone],
  ];
  if (phoneFields.some(([before, after]) => (before || '') !== (after || ''))) {
    next.lastVerified = null;
  }

  hospital.contacts = next;
  await hospital.save();

  const data = serializeHospitalForOwner(hospital);
  broadcastHospitalUpdate(hospital);
  res.json({ success: true, data });
});

export const verifyContacts = asyncHandler(async (req, res) => {
  const hospital = await findOwnedHospital(req);
  hospital.contacts.lastVerified = new Date();
  await hospital.save();

  const data = serializeHospitalForOwner(hospital);
  broadcastHospitalUpdate(hospital);
  res.json({ success: true, data });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const hospital = await findOwnedHospital(req);
  const { specialties, doctorsOnDuty, is24x7, ambulanceAvailable } = req.validated.body;
  if (specialties !== undefined) hospital.specialties = specialties;
  if (doctorsOnDuty !== undefined) hospital.doctorsOnDuty = doctorsOnDuty;
  if (is24x7 !== undefined) hospital.is24x7 = is24x7;
  if (ambulanceAvailable !== undefined) hospital.ambulanceAvailable = ambulanceAvailable;
  await hospital.save();

  const data = serializeHospitalForOwner(hospital);
  broadcastHospitalUpdate(hospital);
  res.json({ success: true, data });
});
