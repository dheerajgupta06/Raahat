import { STALE_AFTER_MINUTES, VERIFIED_WINDOW_DAYS, BED_KEYS } from '../constants.js';
import { isReceptionOpen, formatTimings } from '../utils/time.js';

const MS_MINUTE = 60 * 1000;
const MS_DAY = 24 * 60 * 60 * 1000;

const sumBeds = (beds, field) =>
  BED_KEYS.reduce((sum, key) => sum + (Number(beds?.[key]?.[field]) || 0), 0);

export function bedAvailabilityState(available, total) {
  if (!total || total <= 0) return 'red';
  const ratio = available / total;
  if (ratio >= 0.3) return 'green';
  if (ratio >= 0.1) return 'yellow';
  return 'red';
}

export function hospitalLevel(hospital) {
  const hasTrauma = hospital.specialties?.includes('Trauma');
  const icuTotal = hospital.beds?.icu?.total || 0;
  if (hasTrauma && icuTotal >= 10) return { code: 1, label: 'Level 1 Apex Trauma' };
  if (hasTrauma || icuTotal > 0) return { code: 2, label: 'Level 2 Emergency' };
  return { code: 3, label: 'Level 3 Care' };
}

/**
 * Public payload. Deliberately omits receptionistName and alternatePhone so a
 * staff member's personal/alternate line is never rendered to the public.
 */
export function serializeHospital(hospital, extras = {}) {
  const beds = BED_KEYS.reduce((acc, key) => {
    const bed = hospital.beds?.[key] || {};
    acc[key] = {
      total: Number(bed.total) || 0,
      available: Number(bed.available) || 0,
    };
    return acc;
  }, {});

  const totalBeds = sumBeds(beds, 'total');
  const availableBeds = sumBeds(beds, 'available');
  const lastUpdated = hospital.lastUpdated ? new Date(hospital.lastUpdated) : new Date(0);
  const ageMinutes = Math.max(0, Math.round((Date.now() - lastUpdated.getTime()) / MS_MINUTE));
  const isStale = ageMinutes > STALE_AFTER_MINUTES;
  const lastVerified = hospital.contacts?.lastVerified ? new Date(hospital.contacts.lastVerified) : null;
  const verifiedRecently = Boolean(lastVerified && Date.now() - lastVerified.getTime() <= VERIFIED_WINDOW_DAYS * MS_DAY);
  const openNow = isReceptionOpen(hospital.contacts?.reception, hospital.is24x7);
  const level = hospitalLevel(hospital);

  return {
    id: hospital._id.toString(),
    name: hospital.name,
    type: hospital.type,
    address: hospital.address,
    city: hospital.city,
    state: hospital.state,
    pincode: hospital.pincode,
    location: {
      lat: hospital.location?.coordinates?.[1] ?? null,
      lng: hospital.location?.coordinates?.[0] ?? null,
    },
    is24x7: Boolean(hospital.is24x7),
    ambulanceAvailable: Boolean(hospital.ambulanceAvailable),
    specialties: hospital.specialties || [],
    beds,
    totalBeds,
    availableBeds,
    occupancy: totalBeds ? Math.round(((totalBeds - availableBeds) / totalBeds) * 100) : 100,
    bedStatus: bedAvailabilityState(availableBeds, totalBeds),
    oxygenStatus: hospital.oxygenStatus,
    oxygenCylinders: hospital.oxygenCylinders || 0,
    doctorsOnDuty: (hospital.doctorsOnDuty || []).map((doctor) => ({
      name: doctor.name,
      specialty: doctor.specialty,
      available: Boolean(doctor.available),
    })),
    level,
    lastUpdated: lastUpdated.toISOString(),
    dataAgeMinutes: ageMinutes,
    isStale,
    isDemo: Boolean(hospital.isDemo),
    contacts: {
      reception: {
        phone: hospital.contacts?.reception?.phone || '',
        whatsapp: hospital.contacts?.reception?.whatsapp || '',
        is24x7: Boolean(hospital.contacts?.reception?.is24x7),
        timings: {
          open: hospital.contacts?.reception?.timings?.open || '09:00',
          close: hospital.contacts?.reception?.timings?.close || '21:00',
        },
        timingLabel: formatTimings(hospital.contacts?.reception),
        isOpenNow: openNow,
      },
      emergencyWard: { phone: hospital.contacts?.emergencyWard?.phone || '' },
      ambulance: { phone: hospital.contacts?.ambulance?.phone || '' },
      mainLine: { phone: hospital.contacts?.mainLine?.phone || '' },
      lastVerified: lastVerified ? lastVerified.toISOString() : null,
      verifiedRecently,
    },
    ...extras,
  };
}

/** Owner payload used only behind JWT auth. Includes private contact fields. */
export function serializeHospitalForOwner(hospital) {
  const base = serializeHospital(hospital);
  const document = hospital.registration?.document;
  return {
    ...base,
    canManage: true,
    registration: document
      ? {
          status: hospital.registration.status || 'pending',
          uploadedAt: new Date(document.uploadedAt).toISOString(),
          reviewedAt: hospital.registration.reviewedAt
            ? new Date(hospital.registration.reviewedAt).toISOString()
            : null,
          note: hospital.registration.note || '',
          document: {
            originalName: document.originalName,
            mimeType: document.mimeType,
            size: document.size,
          },
        }
      : null,
    contacts: {
      ...base.contacts,
      reception: {
        ...base.contacts.reception,
        alternatePhone: hospital.contacts?.reception?.alternatePhone || '',
        receptionistName: hospital.contacts?.reception?.receptionistName || '',
      },
    },
  };
}

/**
 * Control-room payload. Includes the registration queue metadata and official
 * contact lines, but never the receptionist's personal name or alternate number.
 */
export function serializeHospitalForAdmin(hospital, applicant = null) {
  const base = serializeHospital(hospital);
  const document = hospital.registration?.document;
  return {
    ...base,
    registration: document
      ? {
          status: hospital.registration.status || 'pending',
          uploadedAt: new Date(document.uploadedAt || hospital.createdAt).toISOString(),
          reviewedAt: hospital.registration.reviewedAt
            ? new Date(hospital.registration.reviewedAt).toISOString()
            : null,
          note: hospital.registration.note || '',
          document: {
            originalName: document.originalName,
            mimeType: document.mimeType,
            size: document.size,
          },
        }
      : null,
    applicant: applicant
      ? {
          id: applicant._id.toString(),
          name: applicant.name,
          email: applicant.email,
          designation: applicant.designation || 'Hospital administrator',
          phone: applicant.phone || '',
        }
      : null,
    createdAt: hospital.createdAt ? new Date(hospital.createdAt).toISOString() : null,
    updatedAt: hospital.updatedAt ? new Date(hospital.updatedAt).toISOString() : null,
  };
}

export function sanitizePublicContacts(hospital) {
  return {
    hospitalId: hospital._id.toString(),
    hospital: hospital.name,
    contacts: serializeHospital(hospital).contacts,
  };
}
