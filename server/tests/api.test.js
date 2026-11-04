process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'raahat-test-secret';
process.env.DB_AUTO_SEED = 'false';
delete process.env.MONGODB_URI;

import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';

const uploadDir = path.join(os.tmpdir(), `raahat-test-uploads-${Date.now()}`);
process.env.UPLOAD_DIR = uploadDir;

// 1×1 PNG — enough to exercise the upload pipeline.
const sampleDocument = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

let app;
let api;
let demoToken;
let demoHospitalId;
let adminToken;

before(async () => {
  const db = await import('../src/config/db.js');
  const seed = await import('../src/seed/seedDb.js');
  const appModule = await import('../src/app.js');

  await db.connectDB();
  await seed.seedDatabase({ reset: true });
  app = appModule.createApp();
  api = request(app);
});

after(async () => {
  const db = await import('../src/config/db.js');
  await db.disconnectDB();
  await fs.rm(uploadDir, { recursive: true, force: true });
});

test('health endpoint reports a live database', async () => {
  const res = await api.get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.data.status, 'ok');
  assert.equal(res.body.data.dbState, 1);
});

test('network stats summarise beds and oxygen', async () => {
  const res = await api.get('/api/hospitals/stats');
  assert.equal(res.status, 200);
  assert.equal(res.body.data.hospitals, 25);
  assert.ok(res.body.data.availableBeds > 0);
  assert.ok(res.body.data.icuAvailable > 0);
  assert.ok(res.body.data.oxygenReady > 0);
});

test('nearby query uses geo radius, scores and sanitizes contacts', async () => {
  const res = await api
    .get('/api/hospitals/nearby')
    .query({ lat: 28.5708, lng: 77.326, radius: 10, problem: 'heart', severity: 'critical' });

  assert.equal(res.status, 200);
  assert.ok(res.body.data.length > 0);
  assert.equal(res.body.meta.count, res.body.data.length);

  for (const hospital of res.body.data) {
    assert.ok(hospital.distanceKm <= 10.2);
    assert.equal(hospital.location.lat > 28 && hospital.location.lat < 29, true);
    assert.ok(hospital.contacts.reception.phone);
    assert.equal(hospital.contacts.reception.receptionistName, undefined);
    assert.equal(hospital.contacts.reception.alternatePhone, undefined);
    assert.equal(typeof hospital.score, 'number');
    assert.ok(hospital.matchPercent >= 0 && hospital.matchPercent <= 100);
  }

  assert.equal(res.body.meta.sort, 'nearest');
  const distances = res.body.data.map((hospital) => hospital.distanceKm);
  assert.deepEqual(distances, [...distances].sort((a, b) => a - b));
  assert.equal(res.body.data[0].rank, 1);
});

test('nearby query honours explicit sort order', async () => {
  const res = await api
    .get('/api/hospitals/nearby')
    .query({ lat: 28.5708, lng: 77.326, radius: 10, problem: 'heart', severity: 'critical', sort: 'best' });

  assert.equal(res.status, 200);
  assert.equal(res.body.meta.sort, 'best');
  const scores = res.body.data.map((hospital) => hospital.score);
  assert.deepEqual(scores, [...scores].sort((a, b) => b - a));
});

test('nearby query validates coordinates and radius', async () => {
  const missing = await api.get('/api/hospitals/nearby');
  assert.equal(missing.status, 400);

  const badRadius = await api
    .get('/api/hospitals/nearby')
    .query({ lat: 28.57, lng: 77.32, radius: 500 });
  assert.equal(badRadius.status, 400);
});

test('demo hospital login and authenticated profile', async () => {
  const res = await api.post('/api/auth/login').send({ email: 'demo@raahat.demo', password: 'Raahat@123' });
  assert.equal(res.status, 200);
  assert.ok(res.body.token);
  assert.ok(res.body.data.hospital.contacts.reception.receptionistName);

  demoToken = res.body.token;
  demoHospitalId = res.body.data.hospital.id;

  const me = await api.get('/api/hospitals/me').set('Authorization', `Bearer ${demoToken}`);
  assert.equal(me.status, 200);
  assert.equal(me.body.data.hospital.id, demoHospitalId);
  assert.ok(me.body.data.hospital.contacts.reception.alternatePhone);
});

test('invalid credentials are rejected', async () => {
  const res = await api.post('/api/auth/login').send({ email: 'demo@raahat.demo', password: 'wrong-password' });
  assert.equal(res.status, 401);
});

test('bed update requires auth and ownership', async () => {
  const url = `/api/hospitals/${demoHospitalId}/beds`;

  const anon = await api.put(url).send({ general: { available: 3 } });
  assert.equal(anon.status, 401);

  const otherLogin = await api
    .post('/api/auth/login')
    .send({ email: 'hospital2@raahat.demo', password: 'Raahat@123' });
  const forbidden = await api
    .put(url)
    .set('Authorization', `Bearer ${otherLogin.body.token}`)
    .send({ general: { available: 3 } });
  assert.equal(forbidden.status, 403);

  const ok = await api
    .put(url)
    .set('Authorization', `Bearer ${demoToken}`)
    .send({ general: { available: 7 } });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.data.beds.general.available, 7);
  assert.ok(ok.body.data.beds.general.total >= 7);
});

test('bed update rejects unavailable beds above total', async () => {
  const res = await api
    .put(`/api/hospitals/${demoHospitalId}/beds`)
    .set('Authorization', `Bearer ${demoToken}`)
    .send({ icu: { total: 2, available: 9 } });
  assert.equal(res.status, 400);
});

test('oxygen update changes status and cylinder count', async () => {
  const res = await api
    .put(`/api/hospitals/${demoHospitalId}/oxygen`)
    .set('Authorization', `Bearer ${demoToken}`)
    .send({ oxygenStatus: 'limited', oxygenCylinders: 14 });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.oxygenStatus, 'limited');
  assert.equal(res.body.data.oxygenCylinders, 14);
});

test('public contact endpoint never exposes private contact fields', async () => {
  const res = await api.get(`/api/hospitals/${demoHospitalId}/contacts`);
  assert.equal(res.status, 200);
  assert.ok(res.body.data.contacts.reception.phone);
  assert.equal(res.body.data.contacts.reception.receptionistName, undefined);
  assert.equal(res.body.data.contacts.reception.alternatePhone, undefined);
});

test('contact phone changes invalidate verification and verify restores it', async () => {
  const verified = await api
    .post(`/api/hospitals/${demoHospitalId}/contacts/verify`)
    .set('Authorization', `Bearer ${demoToken}`);
  assert.equal(verified.status, 200);
  assert.ok(verified.body.data.contacts.lastVerified);

  const updated = await api
    .put(`/api/hospitals/${demoHospitalId}/contacts`)
    .set('Authorization', `Bearer ${demoToken}`)
    .send({ reception: { phone: '0120-0000099' } });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.contacts.lastVerified, null);

  const reverified = await api
    .post(`/api/hospitals/${demoHospitalId}/contacts/verify`)
    .set('Authorization', `Bearer ${demoToken}`);
  assert.ok(reverified.body.data.contacts.lastVerified);
});

test('invalid Indian phone numbers and times are rejected', async () => {
  const badPhone = await api
    .put(`/api/hospitals/${demoHospitalId}/contacts`)
    .set('Authorization', `Bearer ${demoToken}`)
    .send({ reception: { phone: '12345' } });
  assert.equal(badPhone.status, 400);

  const badTime = await api
    .put(`/api/hospitals/${demoHospitalId}/contacts`)
    .set('Authorization', `Bearer ${demoToken}`)
    .send({ reception: { timings: { open: '25:00' } } });
  assert.equal(badTime.status, 400);
});

test('hospital registration creates an isolated admin and hospital', async () => {
  const payload = {
    admin: {
      name: 'Test Administrator',
      email: 'newhospital@raahat.test',
      password: 'StrongPass123',
    },
    hospital: {
      name: 'Test Valley Hospital',
      type: 'Private',
      address: '12 Test Road, Sector 9',
      city: 'Noida',
      state: 'Uttar Pradesh',
      pincode: '201301',
      lat: 28.58,
      lng: 77.33,
      specialties: ['General Medicine', 'Emergency'],
      is24x7: true,
      ambulanceAvailable: true,
      contacts: {
        reception: {
          phone: '0120-0000098',
          alternatePhone: '0120-0000097',
          receptionistName: 'Private Person',
          whatsapp: '9000000098',
          is24x7: false,
          timings: { open: '09:00', close: '18:00' },
        },
        emergencyWard: { phone: '0120-0000096' },
        ambulance: { phone: '9000000095' },
        mainLine: { phone: '0120-0000094' },
      },
    },
  };

  const missingDocument = await api
    .post('/api/auth/register')
    .field('admin', JSON.stringify(payload.admin))
    .field('hospital', JSON.stringify(payload.hospital));
  assert.equal(missingDocument.status, 400);
  assert.match(missingDocument.body.message, /registration certificate/i);

  const wrongType = await api
    .post('/api/auth/register')
    .field('admin', JSON.stringify(payload.admin))
    .field('hospital', JSON.stringify(payload.hospital))
    .attach('document', Buffer.from('not a certificate'), {
      filename: 'registration.txt',
      contentType: 'text/plain',
    });
  assert.equal(wrongType.status, 400);
  assert.match(wrongType.body.message, /PDF, JPG or PNG/i);

  const fakeImage = await api
    .post('/api/auth/register')
    .field('admin', JSON.stringify(payload.admin))
    .field('hospital', JSON.stringify(payload.hospital))
    .attach('document', Buffer.from('not really a png'), {
      filename: 'fake.png',
      contentType: 'image/png',
    });
  assert.equal(fakeImage.status, 400);
  assert.match(fakeImage.body.message, /not a valid/i);

  const registerRequest = () =>
    api
      .post('/api/auth/register')
      .field('admin', JSON.stringify(payload.admin))
      .field('hospital', JSON.stringify(payload.hospital))
      .attach('document', sampleDocument, { filename: 'registration.png', contentType: 'image/png' });

  const res = await registerRequest();
  assert.equal(res.status, 201);
  assert.ok(res.body.token);
  const hospitalId = res.body.data.hospital.id;
  assert.equal(res.body.data.hospital.registration.status, 'pending');
  assert.equal(res.body.data.hospital.registration.document.originalName, 'registration.png');

  const unauthorisedDownload = await api.get('/api/hospitals/me/registration');
  assert.equal(unauthorisedDownload.status, 401);

  const documentDownload = await api
    .get('/api/hospitals/me/registration')
    .set('Authorization', `Bearer ${res.body.token}`);
  assert.equal(documentDownload.status, 200);
  assert.equal(documentDownload.headers['content-type'], 'image/png');
  assert.ok(documentDownload.body.length > 0);

  const publicContacts = await api.get(`/api/hospitals/${hospitalId}/contacts`);
  assert.equal(publicContacts.status, 200);
  assert.equal(publicContacts.body.data.contacts.reception.receptionistName, undefined);
  assert.equal(publicContacts.body.data.contacts.reception.alternatePhone, undefined);
  assert.equal(publicContacts.body.data.registration, undefined);
  assert.equal(typeof publicContacts.body.data.contacts.reception.isOpenNow, 'boolean');

  const duplicate = await registerRequest();
  assert.equal(duplicate.status, 409);
});

test('control room login is restricted to super admins', async () => {
  const badPassword = await api
    .post('/api/admin/login')
    .send({ email: 'control@raahat.demo', password: 'wrong-password' });
  assert.equal(badPassword.status, 401);

  const staffAccount = await api
    .post('/api/admin/login')
    .send({ email: 'demo@raahat.demo', password: 'Raahat@123' });
  assert.equal(staffAccount.status, 403);

  const res = await api
    .post('/api/admin/login')
    .send({ email: 'control@raahat.demo', password: 'Raahat@123' });
  assert.equal(res.status, 200);
  assert.ok(res.body.token);
  assert.equal(res.body.data.admin.role, 'super_admin');
  assert.equal(res.body.data.admin.hospitalId, null);
  adminToken = res.body.token;

  const me = await api.get('/api/admin/me').set('Authorization', `Bearer ${adminToken}`);
  assert.equal(me.status, 200);
  assert.equal(me.body.data.admin.email, 'control@raahat.demo');

  const staffTokenAccess = await api
    .get('/api/admin/overview')
    .set('Authorization', `Bearer ${demoToken}`);
  assert.equal(staffTokenAccess.status, 403);
});

test('registration queue, notifications and private document access', async () => {
  const queue = await api
    .get('/api/admin/registrations')
    .query({ status: 'pending' })
    .set('Authorization', `Bearer ${adminToken}`);

  assert.equal(queue.status, 200);
  const application = queue.body.data.find((hospital) => hospital.name === 'Test Valley Hospital');
  assert.ok(application);
  assert.equal(application.registration.status, 'pending');
  assert.equal(application.registration.document.originalName, 'registration.png');
  assert.equal(application.applicant.email, 'newhospital@raahat.test');
  assert.equal(application.contacts.reception.receptionistName, undefined);
  assert.equal(application.contacts.reception.alternatePhone, undefined);
  assert.ok(queue.body.meta.counts.pending >= 1);

  const notifications = await api
    .get('/api/admin/notifications')
    .set('Authorization', `Bearer ${adminToken}`);
  assert.equal(notifications.status, 200);
  assert.ok(notifications.body.meta.unread >= 1);
  const submitted = notifications.body.data.find(
    (item) => item.type === 'registration_submitted' && item.hospitalId === application.id
  );
  assert.ok(submitted);
  assert.equal(submitted.read, false);

  const marked = await api
    .post(`/api/admin/notifications/${submitted.id}/read`)
    .set('Authorization', `Bearer ${adminToken}`);
  assert.equal(marked.status, 200);
  assert.equal(marked.body.data.read, true);
  assert.ok(marked.body.meta.unread < notifications.body.meta.unread);

  const document = await api
    .get(`/api/admin/registrations/${application.id}/document`)
    .set('Authorization', `Bearer ${adminToken}`);
  assert.equal(document.status, 200);
  assert.equal(document.headers['content-type'], 'image/png');
  assert.ok(document.body.length > 0);

  const staffDenied = await api
    .get(`/api/admin/registrations/${application.id}/document`)
    .set('Authorization', `Bearer ${demoToken}`);
  assert.equal(staffDenied.status, 403);

  const overview = await api.get('/api/admin/overview').set('Authorization', `Bearer ${adminToken}`);
  assert.equal(overview.status, 200);
  assert.ok(overview.body.data.stats.pending >= 1);
  assert.ok(overview.body.data.stats.hospitals >= 26);
  assert.ok(overview.body.data.recentRegistrations.length >= 1);
});

test('control room approves and rejects registrations with notes', async () => {
  const queue = await api
    .get('/api/admin/registrations')
    .query({ status: 'pending' })
    .set('Authorization', `Bearer ${adminToken}`);
  const application = queue.body.data.find((hospital) => hospital.name === 'Test Valley Hospital');
  assert.ok(application);

  const missingNote = await api
    .post(`/api/admin/registrations/${application.id}/review`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ decision: 'reject' });
  assert.equal(missingNote.status, 400);

  const rejected = await api
    .post(`/api/admin/registrations/${application.id}/review`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ decision: 'reject', note: 'Certificate scan is unreadable' });
  assert.equal(rejected.status, 200);
  assert.equal(rejected.body.data.registration.status, 'rejected');
  assert.equal(rejected.body.data.registration.note, 'Certificate scan is unreadable');
  assert.ok(rejected.body.data.registration.reviewedAt);

  const owner = await api
    .post('/api/auth/login')
    .send({ email: 'newhospital@raahat.test', password: 'StrongPass123' });
  assert.equal(owner.status, 200);
  assert.equal(owner.body.data.hospital.registration.status, 'rejected');
  assert.equal(owner.body.data.hospital.registration.note, 'Certificate scan is unreadable');

  const approved = await api
    .post(`/api/admin/registrations/${application.id}/review`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ decision: 'approve', note: 'Checked against state portal' });
  assert.equal(approved.status, 200);
  assert.equal(approved.body.data.registration.status, 'verified');

  const ownerAfter = await api
    .get('/api/hospitals/me')
    .set('Authorization', `Bearer ${owner.body.token}`);
  assert.equal(ownerAfter.body.data.hospital.registration.status, 'verified');

  const notifications = await api
    .get('/api/admin/notifications')
    .set('Authorization', `Bearer ${adminToken}`);
  const types = notifications.body.data.map((item) => item.type);
  assert.ok(types.includes('registration_rejected'));
  assert.ok(types.includes('registration_approved'));

  const noCertificate = await api
    .post(`/api/admin/registrations/${demoHospitalId}/review`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ decision: 'approve' });
  assert.equal(noCertificate.status, 400);

  const unknown = await api
    .post('/api/admin/registrations/64b000000000000000000000/review')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ decision: 'approve' });
  assert.equal(unknown.status, 404);
});

test('control room search and contact verification update the public badge', async () => {
  const queue = await api
    .get('/api/admin/registrations')
    .query({ status: 'verified' })
    .set('Authorization', `Bearer ${adminToken}`);
  const application = queue.body.data.find((hospital) => hospital.name === 'Test Valley Hospital');
  assert.ok(application);

  const verified = await api
    .post(`/api/admin/hospitals/${application.id}/verify-contacts`)
    .set('Authorization', `Bearer ${adminToken}`);
  assert.equal(verified.status, 200);
  assert.ok(verified.body.data.contacts.lastVerified);
  assert.equal(verified.body.data.contacts.verifiedRecently, true);

  const publicDetail = await api.get(`/api/hospitals/${application.id}`);
  assert.equal(publicDetail.status, 200);
  assert.equal(publicDetail.body.data.contacts.verifiedRecently, true);

  const search = await api
    .get('/api/admin/hospitals')
    .query({ q: 'Test Valley', status: 'verified' })
    .set('Authorization', `Bearer ${adminToken}`);
  assert.equal(search.status, 200);
  assert.equal(search.body.data.length, 1);
  assert.equal(search.body.data[0].id, application.id);

  const unregistered = await api
    .get('/api/admin/hospitals')
    .query({ q: 'Test Valley', status: 'unregistered' })
    .set('Authorization', `Bearer ${adminToken}`);
  assert.equal(unregistered.body.data.length, 0);

  const unknown = await api
    .post('/api/admin/hospitals/64b000000000000000000000/verify-contacts')
    .set('Authorization', `Bearer ${adminToken}`);
  assert.equal(unknown.status, 404);
});

test('unknown hospitals return 404', async () => {
  const res = await api.get('/api/hospitals/64b000000000000000000000');
  assert.equal(res.status, 404);
});
