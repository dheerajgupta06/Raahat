import { PROBLEM_PROFILES, SEVERITY_WEIGHTS } from '../constants.js';
import { estimateEtaMinutes, roundKm } from '../utils/geo.js';
import { bedAvailabilityState } from './serializers.js';

const clamp01 = (value) => Math.min(1, Math.max(0, value));

function hasCapability(hospital, token) {
  switch (token) {
    case 'ICU':
      return (hospital.beds?.icu?.total || 0) > 0;
    case 'Oxygen':
      return hospital.oxygenStatus !== 'unavailable';
    case 'Emergency':
      return Boolean(hospital.is24x7);
    case 'NICU':
    case 'Dialysis':
    case 'Blood Bank':
    case 'Radiology':
      return (hospital.specialties || []).includes(token);
    default:
      return (hospital.specialties || []).includes(token);
  }
}

function relevantBedTypes(requiredTokens) {
  const types = new Set();
  if (requiredTokens.includes('ICU')) types.add('icu');
  if (requiredTokens.includes('Oxygen')) types.add('oxygen');
  if (requiredTokens.includes('Emergency')) types.add('emergency');
  if (!types.size) {
    types.add('general');
    types.add('emergency');
  }
  return [...types];
}

/**
 * Score = weighted distance + capability match + relevant beds + oxygen + 24x7.
 * Critical cases trade a little distance weight for ICU/oxygen availability.
 */
export function evaluateHospital(hospital, { distanceKm, radiusKm, problem, severity }) {
  const profile = PROBLEM_PROFILES[problem] || PROBLEM_PROFILES.other;
  const weights = SEVERITY_WEIGHTS[severity] || SEVERITY_WEIGHTS.serious;
  const required = [...new Set([...profile.specialties, ...profile.facilities])];

  const matched = required.filter((token) => hasCapability(hospital, token));
  const missing = required.filter((token) => !hasCapability(hospital, token));
  const matchPercent = required.length ? Math.round((matched.length / required.length) * 100) : 0;

  const bedTypes = relevantBedTypes(required);
  const careTotal = bedTypes.reduce((sum, key) => sum + (hospital.beds?.[key]?.total || 0), 0);
  const careAvailable = bedTypes.reduce((sum, key) => sum + (hospital.beds?.[key]?.available || 0), 0);
  const careRatio = careTotal > 0 ? careAvailable / careTotal : 0;

  const distanceScore = clamp01(1 - distanceKm / Math.max(radiusKm, 0.5)) * weights.distance;
  const specialtyScore = (matchPercent / 100) * weights.specialty;
  const bedsScore = Math.min(1, careRatio * 1.25) * weights.beds;
  const oxygenScore =
    (hospital.oxygenStatus === 'available' ? 1 : hospital.oxygenStatus === 'limited' ? 0.5 : 0) *
    weights.oxygen;
  const emergencyScore =
    ((hospital.is24x7 ? 0.8 : 0.15) + (hospital.ambulanceAvailable ? 0.2 : 0)) * weights.emergency;

  const lastVerified = hospital.contacts?.lastVerified
    ? new Date(hospital.contacts.lastVerified).getTime()
    : 0;
  const verifiedBonus = Date.now() - lastVerified <= 30 * 24 * 60 * 60 * 1000 ? 3 : 0;
  const freshBonus =
    Date.now() - new Date(hospital.lastUpdated || 0).getTime() <= 60 * 60 * 1000 ? 2 : 0;

  const score = Math.round(
    Math.min(100, distanceScore + specialtyScore + bedsScore + oxygenScore + emergencyScore + verifiedBonus + freshBonus)
  );

  return {
    score,
    matchPercent,
    matched,
    missing,
    required,
    distanceKm: roundKm(distanceKm),
    etaMinutes: estimateEtaMinutes(distanceKm),
    careAvailable,
    careTotal,
    careBedStatus: bedAvailabilityState(careAvailable, careTotal),
    oxygenScore: Math.round(oxygenScore / Math.max(weights.oxygen, 1) * 100),
  };
}

const SORTERS = {
  best: (a, b) => b.score - a.score || a.distanceKm - b.distanceKm,
  nearest: (a, b) => a.distanceKm - b.distanceKm || b.score - a.score,
  beds: (a, b) => b.careAvailable - a.careAvailable || a.distanceKm - b.distanceKm,
  oxygen: (a, b) => b.oxygenScore - a.oxygenScore || b.score - a.score,
};

export function sortHospitals(hospitals, sort = 'nearest') {
  const sorter = SORTERS[sort] || SORTERS.nearest;
  return [...hospitals].sort(sorter).map((hospital, index) => ({ ...hospital, rank: index + 1 }));
}
