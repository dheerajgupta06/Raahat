import fs from 'node:fs/promises';
import path from 'node:path';
import config from '../config/env.js';

const EXTENSION_BY_MIME = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
};

export const registrationDir = path.join(config.uploadDir, 'registrations');

function cleanOriginalName(name) {
  const base = path.basename(String(name || 'registration-document'));
  return base.replace(/[^\w.\- ()]+/g, '_').slice(0, 120) || 'registration-document';
}

export async function saveRegistrationDocument(file, hospitalId) {
  const extension = EXTENSION_BY_MIME[file.mimetype];
  if (!extension) throw new Error('Unsupported document type');

  await fs.mkdir(registrationDir, { recursive: true });
  const filename = `${hospitalId}-${Date.now()}${extension}`;
  await fs.writeFile(path.join(registrationDir, filename), file.buffer, { flag: 'wx' });

  return {
    filename,
    originalName: cleanOriginalName(file.originalname),
    mimeType: file.mimetype,
    size: file.size,
    uploadedAt: new Date(),
  };
}

export async function removeRegistrationDocument(filename) {
  if (!filename || path.basename(filename) !== filename) return;
  await fs.unlink(path.join(registrationDir, filename)).catch(() => {});
}

export function resolveRegistrationDocument(filename) {
  if (!filename || path.basename(filename) !== filename) return null;
  return path.join(registrationDir, filename);
}
