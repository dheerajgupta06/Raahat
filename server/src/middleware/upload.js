import multer from 'multer';
import { httpError } from '../utils/http.js';

export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Map([
  ['application/pdf', '.pdf'],
  ['image/jpeg', '.jpg'],
  ['image/jpg', '.jpg'],
  ['image/png', '.png'],
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_DOCUMENT_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    const extension = ALLOWED_TYPES.get(file.mimetype);
    const nameLooksValid = /\.(pdf|jpe?g|png)$/i.test(file.originalname || '');
    if (!extension || !nameLooksValid) {
      return callback(httpError(400, 'Upload a PDF, JPG or PNG registration certificate'));
    }
    return callback(null, true);
  },
});

export function registrationDocumentUpload(req, res, next) {
  upload.single('document')(req, res, (error) => {
    if (!error) return next();
    if (error.code === 'LIMIT_FILE_SIZE') {
      return next(httpError(400, 'Registration document must be 5 MB or smaller'));
    }
    if (error instanceof multer.MulterError) {
      return next(httpError(400, 'Could not accept the uploaded document'));
    }
    return next(error);
  });
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function hasValidSignature(file) {
  const buffer = file.buffer || Buffer.alloc(0);
  if (file.mimetype === 'application/pdf') {
    return buffer.subarray(0, 5).toString('latin1') === '%PDF-';
  }
  if (file.mimetype === 'image/png') {
    return buffer.subarray(0, 8).equals(PNG_SIGNATURE);
  }
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  return false;
}

/** FormData carries the two JSON sections as text fields. */
export function parseRegistrationPayload(req, _res, next) {
  if (req.file && !hasValidSignature(req.file)) {
    return next(httpError(400, 'The uploaded file is not a valid PDF, JPG or PNG'));
  }
  if (req.is('multipart/form-data') && typeof req.body.admin === 'string') {
    try {
      req.body = {
        admin: JSON.parse(req.body.admin || '{}'),
        hospital: JSON.parse(req.body.hospital || '{}'),
      };
    } catch {
      return next(httpError(400, 'Invalid registration payload'));
    }
  }
  next();
}
