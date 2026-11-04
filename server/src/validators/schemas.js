import { z } from 'zod';
import {
  BED_KEYS,
  HOSPITAL_TYPES,
  OXYGEN_STATUS,
  PROBLEM_KEYS,
  SEVERITIES,
  SPECIALTIES,
} from '../constants.js';
import { isValidIndianPhone } from '../utils/phone.js';

const phoneSchema = z
  .string({ required_error: 'Phone number is required' })
  .trim()
  .min(1, 'Phone number is required')
  .max(24)
  .refine(isValidIndianPhone, 'Enter a valid 10-digit mobile or landline with STD code');

const optionalPhone = z
  .union([
    z.string().trim().max(24).refine((value) => value === '' || isValidIndianPhone(value), 'Enter a valid Indian phone number or leave blank'),
    z.null(),
  ])
  .optional();

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM 24-hour format');

const timingsSchema = z.object({ open: timeSchema, close: timeSchema });

const contactsInput = z.object({
  reception: z
    .object({
      phone: phoneSchema,
      alternatePhone: optionalPhone,
      receptionistName: z.string().trim().max(60).optional(),
      whatsapp: optionalPhone,
      is24x7: z.boolean().optional(),
      timings: timingsSchema.optional(),
    })
    .optional(),
  emergencyWard: z.object({ phone: optionalPhone }).optional(),
  ambulance: z.object({ phone: optionalPhone }).optional(),
  mainLine: z.object({ phone: optionalPhone }).optional(),
});

const optionalContactsPatch = z
  .object({
    reception: z
      .object({
        phone: phoneSchema.optional(),
        alternatePhone: optionalPhone,
        receptionistName: z.string().trim().max(60).optional(),
        whatsapp: optionalPhone,
        is24x7: z.boolean().optional(),
        timings: timingsSchema.partial().optional(),
      })
      .optional(),
    emergencyWard: z.object({ phone: optionalPhone }).optional(),
    ambulance: z.object({ phone: optionalPhone }).optional(),
    mainLine: z.object({ phone: optionalPhone }).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'Provide at least one contact field');

const bedCount = z
  .object({
    total: z.coerce.number().int().min(0).max(10000).optional(),
    available: z.coerce.number().int().min(0).max(10000).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'Provide total or available');

export const nearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(1).max(50).default(10),
  problem: z.enum(PROBLEM_KEYS).default('other'),
  severity: z.enum(SEVERITIES).default('serious'),
  sort: z.enum(['best', 'nearest', 'beds', 'oxygen']).optional(),
});

export const coordsQuerySchema = z
  .object({
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
  })
  .optional();

export const registerSchema = z.object({
  admin: z.object({
    name: z.string().trim().min(2, 'Name is too short').max(80),
    email: z.string().trim().toLowerCase().email('Enter a valid email').max(160),
    password: z.string().min(8, 'Password must be at least 8 characters').max(72),
    designation: z.string().trim().max(80).optional(),
    phone: optionalPhone,
  }),
  hospital: z.object({
    name: z.string().trim().min(2, 'Hospital name is required').max(140),
    type: z.enum(HOSPITAL_TYPES),
    address: z.string().trim().min(4, 'Address is required').max(240),
    city: z.string().trim().min(2, 'City is required').max(80),
    state: z.string().trim().min(2, 'State is required').max(80),
    pincode: z.string().trim().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
    is24x7: z.boolean().optional(),
    ambulanceAvailable: z.boolean().optional(),
    specialties: z.array(z.enum(SPECIALTIES)).min(1, 'Select at least one specialty').max(30),
    contacts: contactsInput.extend({
      reception: z.object({
        phone: phoneSchema,
        alternatePhone: optionalPhone,
        receptionistName: z.string().trim().max(60).optional(),
        whatsapp: optionalPhone,
        is24x7: z.boolean().optional(),
        timings: timingsSchema.optional(),
      }),
    }),
  }),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email').max(160),
  password: z.string().min(1, 'Password is required').max(72),
});

export const adminRegistrationsQuerySchema = z.object({
  status: z.enum(['all', 'pending', 'verified', 'rejected']).default('pending'),
});

export const adminReviewSchema = z
  .object({
    decision: z.enum(['approve', 'reject']),
    note: z.string().trim().max(400).optional(),
  })
  .refine((value) => value.decision !== 'reject' || (value.note && value.note.length >= 4), {
    message: 'Add a short reason for rejection',
    path: ['note'],
  });

export const adminHospitalsQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  status: z.enum(['all', 'pending', 'verified', 'rejected', 'unregistered']).default('all'),
});

export const notificationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export const bedsPatchSchema = z
  .object(Object.fromEntries(BED_KEYS.map((key) => [key, bedCount.optional()])))
  .refine((value) => Object.keys(value).length > 0, 'Provide at least one bed type');

export const oxygenPatchSchema = z
  .object({
    oxygenStatus: z.enum(OXYGEN_STATUS).optional(),
    oxygenCylinders: z.coerce.number().int().min(0).max(100000).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'Provide oxygen status or cylinder count');

export const contactsPatchSchema = optionalContactsPatch;

export const profilePatchSchema = z
  .object({
    specialties: z.array(z.enum(SPECIALTIES)).max(30).optional(),
    doctorsOnDuty: z
      .array(
        z.object({
          name: z.string().trim().min(2).max(80),
          specialty: z.string().trim().min(2).max(80),
          available: z.boolean().optional(),
        })
      )
      .max(25)
      .optional(),
    is24x7: z.boolean().optional(),
    ambulanceAvailable: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'Provide at least one profile field');
