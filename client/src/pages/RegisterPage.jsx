import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Crosshair,
  FileCheck2,
  Loader2,
  LockKeyhole,
  MapPin,
  Phone,
  Upload,
  UserRound,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { HOSPITAL_TYPES, INDIAN_STATES, SPECIALTIES } from '../lib/constants.js';
import { isValidIndianPhone } from '../lib/format.js';
import { AuthShell } from '../components/auth/AuthShell.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;

function formatFileSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

const INITIAL = {
  name: '',
  type: 'Private',
  address: '',
  city: '',
  state: 'Uttar Pradesh',
  pincode: '',
  lat: '',
  lng: '',
  is24x7: true,
  ambulanceAvailable: true,
  specialties: ['Emergency'],
  receptionPhone: '',
  alternatePhone: '',
  receptionistName: '',
  whatsapp: '',
  receptionIs24x7: true,
  open: '09:00',
  close: '21:00',
  emergencyPhone: '',
  ambulancePhone: '',
  mainLinePhone: '',
  adminName: '',
  adminEmail: '',
  adminPassword: '',
  designation: 'Hospital administrator',
};

function Field({ label, required, error, hint, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="label-xs flex items-center gap-1">
        {label}
        {required ? <span className="text-brand">*</span> : null}
      </span>
      <span className="mt-1.5 block">{children}</span>
      {hint ? <span className="mt-1 block text-[10px] text-muted">{hint}</span> : null}
      {error ? <span className="mt-1 block text-[10px] font-semibold text-danger">{error}</span> : null}
    </label>
  );
}

export function RegisterPage() {
  const { t, auth, register, detectLocation, pushToast } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [documentFile, setDocumentFile] = useState(null);
  const [documentError, setDocumentError] = useState('');

  if (auth) return <Navigate to="/dashboard" replace />;

  const update = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const chooseDocument = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const typeAllowed =
      ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(file.type) &&
      /\.(pdf|jpe?g|png)$/i.test(file.name);
    if (!typeAllowed) {
      setDocumentFile(null);
      setDocumentError(t('auth.docTypeError'));
      return;
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      setDocumentFile(null);
      setDocumentError(t('auth.docSizeError'));
      return;
    }

    setDocumentFile(file);
    setDocumentError('');
    setErrors((prev) => ({ ...prev, document: '' }));
  };

  const toggleSpecialty = (specialty) => {    setForm((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter((item) => item !== specialty)
        : [...prev.specialties, specialty],
    }));
    setErrors((prev) => ({ ...prev, specialties: '' }));
  };

  const useMyLocation = async () => {
    setLocating(true);
    const next = await detectLocation();
    if (next) {
      setForm((prev) => ({
        ...prev,
        lat: String(next.lat),
        lng: String(next.lng),
        city: prev.city || next.city || '',
      }));
      setErrors((prev) => ({ ...prev, lat: '', lng: '' }));
    }
    setLocating(false);
  };

  const validateStepOne = () => {
    const next = {};
    if (form.name.trim().length < 2) next.name = t('auth.required');
    if (form.address.trim().length < 4) next.address = t('auth.required');
    if (form.city.trim().length < 2) next.city = t('auth.required');
    if (form.state.trim().length < 2) next.state = t('auth.required');
    if (!/^\d{6}$/.test(form.pincode.trim())) next.pincode = t('auth.required');
    if (String(form.lat).trim() === '' || !Number.isFinite(Number(form.lat)) || Math.abs(Number(form.lat)) > 90) next.lat = t('auth.required');
    if (String(form.lng).trim() === '' || !Number.isFinite(Number(form.lng)) || Math.abs(Number(form.lng)) > 180) next.lng = t('auth.required');
    if (!form.specialties.length) next.specialties = t('auth.selectSpecialties');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateStepTwo = () => {
    const next = {};
    if (!isValidIndianPhone(form.receptionPhone)) next.receptionPhone = t('dash.errors.phone');
    ['alternatePhone', 'emergencyPhone', 'ambulancePhone', 'mainLinePhone', 'whatsapp'].forEach((key) => {
      if (form[key] && !isValidIndianPhone(form[key])) next[key] = t('dash.errors.phone');
    });
    if (!TIME_RE.test(form.open)) next.open = t('dash.errors.timing');
    if (!TIME_RE.test(form.close)) next.close = t('dash.errors.timing');
    if (form.adminName.trim().length < 2) next.adminName = t('auth.required');
    if (!EMAIL_RE.test(form.adminEmail.trim())) next.adminEmail = t('auth.required');
    if (form.adminPassword.length < 8) next.adminPassword = t('auth.passwordHint');
    if (!documentFile) next.document = t('auth.docRequired');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (!validateStepOne()) return;
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async (event) => {
    event.preventDefault();
    setFormError('');
    if (!validateStepTwo()) return;
    setBusy(true);

    const payload = {
      document: documentFile,
      admin: {
        name: form.adminName.trim(),
        email: form.adminEmail.trim(),
        password: form.adminPassword,
        designation: form.designation.trim() || 'Hospital administrator',
        phone: '',
      },
      hospital: {
        name: form.name.trim(),
        type: form.type,
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        lat: Number(form.lat),
        lng: Number(form.lng),
        is24x7: form.is24x7,
        ambulanceAvailable: form.ambulanceAvailable,
        specialties: form.specialties,
        contacts: {
          reception: {
            phone: form.receptionPhone.trim(),
            alternatePhone: form.alternatePhone.trim(),
            receptionistName: form.receptionistName.trim(),
            whatsapp: form.whatsapp.trim(),
            is24x7: form.receptionIs24x7,
            timings: { open: form.open, close: form.close },
          },
          emergencyWard: { phone: form.emergencyPhone.trim() },
          ambulance: { phone: form.ambulancePhone.trim() },
          mainLine: { phone: form.mainLinePhone.trim() },
        },
      },
    };

    try {
      await register(payload);
      pushToast(t('auth.success'), 'ok');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const detail = err?.errors?.[0]?.message;
      setFormError(detail ? `${err.message} — ${detail}` : err?.message || t('auth.registerError'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      icon={Building2}
      title={t('auth.registerTitle')}
      subtitle={t('auth.registerSubtitle')}
      footer={
        <p>
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="link font-semibold">
            {t('auth.signInLink')}
          </Link>
        </p>
      }
    >
      <div className="mb-5">
        <div className="flex gap-1.5">
          {[1, 2].map((number) => (
            <span
              key={number}
              className={`h-1 flex-1 rounded-full transition-colors ${step >= number ? 'bg-accent' : 'bg-line'}`}
            />
          ))}
        </div>
        <p className="mt-2 flex items-center justify-between text-[10px] text-muted">
          <span className="font-semibold uppercase tracking-wider">{t('auth.step', { n: step, total: 2 })}</span>
          <span>{step === 1 ? t('auth.step1') : t('auth.step2')}</span>
        </p>
      </div>

      {formError ? (
        <p className="mb-4 rounded-xl border border-danger/35 bg-danger/10 px-3 py-2.5 text-xs font-medium text-danger">
          {formError}
        </p>
      ) : null}

      <form onSubmit={submit} noValidate>
        {step === 1 ? (
          <div className="space-y-3.5">
            <Field label={t('auth.hospitalName')} required error={errors.name}>
              <input value={form.name} onChange={update('name')} className="field" placeholder="Sunrise Emergency Hospital" />
            </Field>

            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field label={t('auth.hospitalType')} required>
                <select value={form.type} onChange={update('type')} className="field">
                  {HOSPITAL_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </Field>
              <Field label={t('auth.pincode')} required error={errors.pincode}>
                <input
                  value={form.pincode}
                  onChange={update('pincode')}
                  className="field"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="201301"
                />
              </Field>
            </div>

            <Field label={t('auth.address')} required error={errors.address}>
              <input value={form.address} onChange={update('address')} className="field" placeholder="Plot 12, Sector 62" />
            </Field>

            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field label={t('auth.city')} required error={errors.city}>
                <input value={form.city} onChange={update('city')} className="field" placeholder="Noida" />
              </Field>
              <Field label={t('auth.state')} required error={errors.state}>
                <select value={form.state} onChange={update('state')} className="field">
                  {INDIAN_STATES.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="rounded-xl border border-line bg-elevated/40 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <p className="label-xs flex items-center gap-1">
                  <MapPin size={10} /> {t('auth.coordsHint')}
                </p>
                <button type="button" onClick={useMyLocation} disabled={locating} className="chip min-h-[30px] px-2.5 py-0 text-[10px] hover:border-accent/40 hover:text-accent">
                  <Crosshair size={11} className={locating ? 'animate-spin' : ''} /> {t('auth.useMyLocation')}
                </button>
              </div>
              <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
                <Field label={t('auth.latitude')} required error={errors.lat}>
                  <input value={form.lat} onChange={update('lat')} className="field-sm" inputMode="decimal" placeholder="28.6272" />
                </Field>
                <Field label={t('auth.longitude')} required error={errors.lng}>
                  <input value={form.lng} onChange={update('lng')} className="field-sm" inputMode="decimal" placeholder="77.3716" />
                </Field>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex items-center gap-2.5 rounded-xl border border-line bg-elevated/40 px-3 py-2.5 text-xs text-body">
                <input type="checkbox" checked={form.is24x7} onChange={update('is24x7')} className="h-4 w-4 accent-accent" />
                {t('auth.is24x7')}
              </label>
              <label className="flex items-center gap-2.5 rounded-xl border border-line bg-elevated/40 px-3 py-2.5 text-xs text-body">
                <input
                  type="checkbox"
                  checked={form.ambulanceAvailable}
                  onChange={update('ambulanceAvailable')}
                  className="h-4 w-4 accent-accent"
                />
                {t('auth.ambulanceAvailable')}
              </label>
            </div>

            <div>
              <p className="label-xs flex items-center gap-1">
                {t('auth.specialties')} <span className="text-brand">*</span>
              </p>
              <p className="mt-1 text-[10px] text-muted">{t('auth.selectSpecialties')}</p>
              {errors.specialties ? <p className="mt-1 text-[10px] font-semibold text-danger">{errors.specialties}</p> : null}
              <div className="thin-scrollbar mt-2 flex max-h-52 flex-wrap gap-1.5 overflow-y-auto rounded-xl border border-line bg-elevated/30 p-2.5">
                {SPECIALTIES.map((specialty) => {
                  const active = form.specialties.includes(specialty);
                  return (
                    <button
                      key={specialty}
                      type="button"
                      onClick={() => toggleSpecialty(specialty)}
                      className={`chip min-h-[30px] px-2.5 py-0 text-[10px] font-semibold transition ${
                        active ? 'border-accent/50 bg-accent/10 text-accent' : 'hover:border-accent/30'
                      }`}
                    >
                      {active ? <Check size={10} /> : null}
                      {t(`specialty.${specialty}`)}
                    </button>
                  );
                })}
              </div>
            </div>

            <button type="button" onClick={goNext} className="btn-accent mt-1 w-full text-sm">
              {t('auth.next')} <ArrowRight size={17} />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="label-xs flex items-center gap-1.5">
                <Phone size={11} className="text-accent" /> {t('dash.contacts')}
              </p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <Field label={t('auth.receptionPhone')} required error={errors.receptionPhone}>
                  <input
                    value={form.receptionPhone}
                    onChange={update('receptionPhone')}
                    className="field-sm"
                    inputMode="tel"
                    placeholder="0120-4000001"
                  />
                </Field>
                <Field label={t('auth.alternatePhone')} error={errors.alternatePhone}>
                  <input
                    value={form.alternatePhone}
                    onChange={update('alternatePhone')}
                    className="field-sm"
                    inputMode="tel"
                    placeholder="9000000001"
                  />
                </Field>
                <Field label={t('auth.receptionistName')}>
                  <input
                    value={form.receptionistName}
                    onChange={update('receptionistName')}
                    className="field-sm"
                    placeholder="Front desk lead"
                  />
                </Field>
                <Field label={t('auth.whatsapp')} error={errors.whatsapp}>
                  <input
                    value={form.whatsapp}
                    onChange={update('whatsapp')}
                    className="field-sm"
                    inputMode="tel"
                    placeholder="9000000001"
                  />
                </Field>
              </div>
              <p className="mt-1.5 flex items-start gap-1 text-[10px] leading-relaxed text-muted">
                <LockKeyhole size={10} className="mt-0.5 shrink-0" /> {t('auth.publicNote')}
              </p>
            </div>

            <div className="rounded-xl border border-line bg-elevated/30 p-3">
              <label className="flex items-center gap-2.5 text-xs text-body">
                <input
                  type="checkbox"
                  checked={form.receptionIs24x7}
                  onChange={update('receptionIs24x7')}
                  className="h-4 w-4 accent-accent"
                />
                {t('auth.reception24x7')}
              </label>
              <div className="mt-2.5 grid grid-cols-2 gap-3">
                <Field label={t('auth.openTime')} error={errors.open}>
                  <input type="time" value={form.open} onChange={update('open')} className="field-sm" />
                </Field>
                <Field label={t('auth.closeTime')} error={errors.close}>
                  <input type="time" value={form.close} onChange={update('close')} className="field-sm" />
                </Field>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('auth.emergencyPhone')} error={errors.emergencyPhone}>
                <input
                  value={form.emergencyPhone}
                  onChange={update('emergencyPhone')}
                  className="field-sm"
                  inputMode="tel"
                  placeholder="0120-4000002"
                />
              </Field>
              <Field label={t('auth.ambulancePhone')} error={errors.ambulancePhone}>
                <input
                  value={form.ambulancePhone}
                  onChange={update('ambulancePhone')}
                  className="field-sm"
                  inputMode="tel"
                  placeholder="9000000002"
                />
              </Field>
              <Field label={t('auth.mainLinePhone')} error={errors.mainLinePhone} className="sm:col-span-2">
                <input
                  value={form.mainLinePhone}
                  onChange={update('mainLinePhone')}
                  className="field-sm"
                  inputMode="tel"
                  placeholder="0120-4000003"
                />
              </Field>
            </div>

            <div className="rounded-xl border border-line bg-elevated/30 p-3.5">
              <p className="label-xs flex items-center gap-1.5">
                <FileCheck2 size={11} className="text-accent" /> {t('auth.registrationDoc')}{' '}
                <span className="text-brand">*</span>
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-muted">{t('auth.registrationDocHint')}</p>

              {documentFile ? (
                <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-ok/30 bg-ok/10 px-3 py-2.5">
                  <FileCheck2 size={17} className="shrink-0 text-ok" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-semibold text-body">{documentFile.name}</span>
                    <span className="block text-[10px] text-muted">{formatFileSize(documentFile.size)}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setDocumentFile(null);
                      setDocumentError('');
                    }}
                    className="icon-btn h-8 w-8 min-h-[32px] min-w-[32px]"
                    aria-label={t('auth.removeDocument')}
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <label className="mt-2.5 flex min-h-[68px] cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line bg-elevated/40 px-3 py-3 text-center transition hover:border-accent/45">
                  <Upload size={16} className="text-accent" />
                  <span className="text-[11px] font-semibold text-body">{t('auth.chooseDocument')}</span>
                  <span className="text-[9px] text-muted">{t('auth.registrationDocTypes')}</span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    onChange={chooseDocument}
                    className="sr-only"
                  />
                </label>
              )}

              {documentError || errors.document ? (
                <p className="mt-1.5 text-[10px] font-semibold text-danger">{documentError || errors.document}</p>
              ) : null}
            </div>

            <div className="border-t border-line pt-4">
              <p className="label-xs flex items-center gap-1.5">
                <UserRound size={11} className="text-accent" /> {t('auth.adminName')}
              </p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <Field label={t('auth.adminName')} required error={errors.adminName}>
                  <input value={form.adminName} onChange={update('adminName')} className="field-sm" autoComplete="name" />
                </Field>
                <Field label={t('auth.designation')}>
                  <input value={form.designation} onChange={update('designation')} className="field-sm" />
                </Field>
                <Field label={t('auth.adminEmail')} required error={errors.adminEmail}>
                  <input
                    type="email"
                    value={form.adminEmail}
                    onChange={update('adminEmail')}
                    className="field-sm"
                    autoComplete="email"
                    placeholder="admin@hospital.in"
                  />
                </Field>
                <Field label={t('auth.adminPassword')} required error={errors.adminPassword} hint={t('auth.passwordHint')}>
                  <input
                    type="password"
                    value={form.adminPassword}
                    onChange={update('adminPassword')}
                    className="field-sm"
                    autoComplete="new-password"
                  />
                </Field>
              </div>
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(1)} className="btn-outline min-h-[52px] px-4 text-xs">
                <ArrowLeft size={15} /> {t('common.back')}
              </button>
              <button type="submit" disabled={busy} className="btn-accent min-h-[52px] flex-1 text-sm">
                {busy ? <Loader2 size={17} className="animate-spin" /> : <Building2 size={17} />}
                {busy ? t('auth.creating') : t('auth.createAccount')}
              </button>
            </div>
            <p className="text-[10px] text-muted">{t('auth.registrationPendingNote')}</p>
          </div>
        )}
      </form>
    </AuthShell>
  );
}
