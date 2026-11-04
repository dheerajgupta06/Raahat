export const HOSPITAL_TYPES = ['Govt', 'Private', 'Trust'];

export const SPECIALTIES = [
  'Cardiology',
  'Cardiothoracic Surgery',
  'Pulmonology',
  'Orthopaedics',
  'Neurology',
  'Neurosurgery',
  'Gynaecology & Obstetrics',
  'Paediatrics',
  'General Medicine',
  'General Surgery',
  'Trauma',
  'Burns',
  'Plastic Surgery',
  'Nephrology',
  'Dialysis',
  'Gastroenterology',
  'Oncology',
  'ENT',
  'Ophthalmology',
  'Dermatology',
  'Psychiatry',
  'Urology',
  'Radiology',
  'Anaesthesiology',
  'Blood Bank',
  'NICU',
  'Emergency',
];

export const OXYGEN_STATUS = ['available', 'limited', 'unavailable'];

export const SEVERITIES = ['critical', 'serious', 'moderate'];

export const BED_KEYS = ['general', 'icu', 'oxygen', 'ventilator', 'emergency'];

/**
 * Each emergency problem maps to the capabilities that matter for triage.
 * "facilities" tokens are resolved against beds / oxygen status / 24x7 flag.
 */
export const PROBLEM_PROFILES = {
  heart: { label: 'Heart attack / chest pain', specialties: ['Cardiology'], facilities: ['ICU', 'Oxygen'] },
  breathing: { label: 'Breathing problem / low oxygen', specialties: ['Pulmonology'], facilities: ['Oxygen', 'ICU'] },
  accident: { label: 'Accident / injury / bleeding', specialties: ['Trauma', 'Orthopaedics'], facilities: ['ICU', 'Blood Bank'] },
  stroke: { label: 'Stroke / paralysis', specialties: ['Neurology'], facilities: ['ICU', 'Radiology'] },
  pregnancy: { label: 'Pregnancy / delivery', specialties: ['Gynaecology & Obstetrics'], facilities: ['NICU', 'ICU'] },
  burns: { label: 'Burns', specialties: ['Burns', 'Plastic Surgery'], facilities: ['ICU', 'Oxygen'] },
  fever: { label: 'Fever / infection', specialties: ['General Medicine'], facilities: ['Oxygen'] },
  poisoning: { label: 'Poisoning / snake bite', specialties: ['General Medicine'], facilities: ['ICU', 'Dialysis'] },
  child: { label: 'Child emergency', specialties: ['Paediatrics'], facilities: ['NICU', 'ICU'] },
  other: { label: 'Other emergency', specialties: ['General Medicine'], facilities: ['Emergency'] },
};

export const PROBLEM_KEYS = Object.keys(PROBLEM_PROFILES);

export const STALE_AFTER_MINUTES = 6 * 60;
export const VERIFIED_WINDOW_DAYS = 30;

export const SEVERITY_WEIGHTS = {
  critical: { distance: 22, specialty: 28, beds: 22, oxygen: 18, emergency: 10 },
  serious: { distance: 32, specialty: 24, beds: 18, oxygen: 16, emergency: 10 },
  moderate: { distance: 40, specialty: 22, beds: 16, oxygen: 12, emergency: 10 },
};
