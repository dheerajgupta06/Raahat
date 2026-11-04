import mongoose from 'mongoose';
import { BED_KEYS, HOSPITAL_TYPES, OXYGEN_STATUS, SPECIALTIES } from '../constants.js';
import { isValidIndianPhone } from '../utils/phone.js';

const phoneValidator = {
  validator: (value) => value === undefined || value === null || value === '' || isValidIndianPhone(value),
  message: 'Invalid Indian phone number',
};

const timingSchema = new mongoose.Schema(
  {
    open: {
      type: String,
      default: '09:00',
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:MM'],
    },
    close: {
      type: String,
      default: '21:00',
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:MM'],
    },
  },
  { _id: false }
);

const receptionSchema = new mongoose.Schema(
  {
    phone: { type: String, required: [true, 'Reception phone is required'], trim: true, validate: phoneValidator },
    alternatePhone: { type: String, trim: true, default: '', validate: phoneValidator },
    receptionistName: { type: String, trim: true, maxlength: 60, default: '' },
    whatsapp: { type: String, trim: true, default: '', validate: phoneValidator },
    is24x7: { type: Boolean, default: true },
    timings: { type: timingSchema, default: () => ({}) },
  },
  { _id: false }
);

const contactsSchema = new mongoose.Schema(
  {
    reception: { type: receptionSchema, required: true },
    emergencyWard: { phone: { type: String, trim: true, default: '', validate: phoneValidator } },
    ambulance: { phone: { type: String, trim: true, default: '', validate: phoneValidator } },
    mainLine: { phone: { type: String, trim: true, default: '', validate: phoneValidator } },
    lastVerified: { type: Date, default: null },
  },
  { _id: false }
);

const bedSchema = new mongoose.Schema(
  {
    total: { type: Number, default: 0, min: 0, max: 10000 },
    available: { type: Number, default: 0, min: 0, max: 10000 },
  },
  { _id: false }
);

const bedsSchema = new mongoose.Schema(
  Object.fromEntries(BED_KEYS.map((key) => [key, { type: bedSchema, default: () => ({}) }])),
  { _id: false }
);

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 80, required: true },
    specialty: { type: String, trim: true, maxlength: 80, required: true },
    available: { type: Boolean, default: true },
  },
  { _id: false }
);

const registrationDocumentSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true, maxlength: 160 },
    mimeType: {
      type: String,
      required: true,
      enum: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
    },
    size: { type: Number, required: true, min: 1 },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const registrationSchema = new mongoose.Schema(
  {
    document: { type: registrationDocumentSchema, default: null },
    status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    note: { type: String, trim: true, maxlength: 400, default: '' },
  },
  { _id: false }
);

const hospitalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 140 },
    type: { type: String, enum: HOSPITAL_TYPES, required: true, default: 'Private' },
    address: { type: String, required: true, trim: true, maxlength: 240 },
    city: { type: String, required: true, trim: true, maxlength: 80 },
    state: { type: String, required: true, trim: true, maxlength: 80 },
    pincode: { type: String, required: true, trim: true, match: [/^\d{6}$/, 'Pincode must be 6 digits'] },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (value) =>
            Array.isArray(value) &&
            value.length === 2 &&
            Math.abs(value[0]) <= 180 &&
            Math.abs(value[1]) <= 90,
          message: 'location.coordinates must be [lng, lat]',
        },
      },
    },
    is24x7: { type: Boolean, default: true },
    ambulanceAvailable: { type: Boolean, default: true },
    specialties: {
      type: [{ type: String, enum: SPECIALTIES }],
      default: [],
    },
    contacts: { type: contactsSchema, required: true },
    beds: { type: bedsSchema, default: () => ({}) },
    oxygenStatus: { type: String, enum: OXYGEN_STATUS, default: 'unavailable' },
    oxygenCylinders: { type: Number, default: 0, min: 0, max: 100000 },
    doctorsOnDuty: { type: [doctorSchema], default: [] },
    registration: { type: registrationSchema, default: null },
    lastUpdated: { type: Date, default: Date.now },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

hospitalSchema.index({ location: '2dsphere' });
hospitalSchema.index({ city: 1 });
hospitalSchema.index({ adminId: 1 });
hospitalSchema.index({ isDemo: 1 });

hospitalSchema.pre('validate', function ensureBedCounts(next) {
  for (const key of BED_KEYS) {
    const bed = this.beds?.[key];
    if (bed && bed.available > bed.total) {
      this.invalidate(
        `beds.${key}.available`,
        'Available beds cannot exceed total beds',
        bed.available
      );
    }
  }
  next();
});

export default mongoose.model('Hospital', hospitalSchema);
