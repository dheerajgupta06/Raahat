import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  Ambulance,
  BadgeCheck,
  BedDouble,
  Building2,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileCheck2,
  FileText,
  Loader2,
  LogOut,
  MapPin,
  Minus,
  Moon,
  Phone,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Stethoscope,
  Sun,
  Type,
  UserRound,
  Wind,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../lib/api.js';
import { BED_KEYS, BED_LABEL_KEYS, OXYGEN_STATUS, SPECIALTIES } from '../lib/constants.js';
import { formatDate, formatPhone, isValidIndianPhone, timeAgo } from '../lib/format.js';
import { TONES } from '../lib/status.js';
import { useHospitalUpdates } from '../hooks/useHospitalUpdates.js';
import { Logo } from '../components/ui/Logo.jsx';
import { CopyButton } from '../components/ui/CopyButton.jsx';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function formatFileSize(bytes) {
  const size = Number(bytes) || 0;
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function makeBedDraft(hospital) {
  return Object.fromEntries(
    BED_KEYS.map((key) => [
      key,
      {
        total: Number(hospital?.beds?.[key]?.total) || 0,
        available: Number(hospital?.beds?.[key]?.available) || 0,
      },
    ])
  );
}

function makeOxygenDraft(hospital) {
  return {
    oxygenStatus: hospital?.oxygenStatus || 'available',
    oxygenCylinders: Number(hospital?.oxygenCylinders) || 0,
  };
}

function makeContactDraft(hospital) {
  const contacts = hospital?.contacts || {};
  return {
    receptionPhone: contacts.reception?.phone || '',
    alternatePhone: contacts.reception?.alternatePhone || '',
    receptionistName: contacts.reception?.receptionistName || '',
    whatsapp: contacts.reception?.whatsapp || '',
    is24x7: Boolean(contacts.reception?.is24x7),
    open: contacts.reception?.timings?.open || '09:00',
    close: contacts.reception?.timings?.close || '21:00',
    emergencyPhone: contacts.emergencyWard?.phone || '',
    ambulancePhone: contacts.ambulance?.phone || '',
    mainLinePhone: contacts.mainLine?.phone || '',
  };
}

function makeProfileDraft(hospital) {
  return {
    specialties: hospital?.specialties || [],
    is24x7: Boolean(hospital?.is24x7),
    ambulanceAvailable: Boolean(hospital?.ambulanceAvailable),
    doctors: (hospital?.doctorsOnDuty || []).map((doctor) => ({
      name: doctor.name || '',
      specialty: doctor.specialty || '',
      available: Boolean(doctor.available),
    })),
  };
}

function LabeledField({ label, children, error, hint, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="label-xs">{label}</span>
      <span className="mt-1.5 block">{children}</span>
      {hint ? <span className="mt-1 block text-[10px] text-muted">{hint}</span> : null}
      {error ? <span className="mt-1 block text-[10px] font-semibold text-danger">{error}</span> : null}
    </label>
  );
}

function SaveButton({ busy, label, savingLabel, onClick, tone = 'accent' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`btn min-h-[48px] px-4 text-xs ${tone === 'accent' ? 'btn-accent' : 'btn-primary'}`}
    >
      {busy ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
      {busy ? savingLabel : label}
    </button>
  );
}

export function DashboardPage() {
  const {
    t,
    auth,
    logout,
    updateSessionHospital,
    pushToast,
    theme,
    toggleTheme,
    largeText,
    toggleLargeText,
    lang,
    toggleLang,
  } = useApp();
  const navigate = useNavigate();

  const [hospital, setHospital] = useState(auth?.hospital || null);
  const [admin, setAdmin] = useState(auth?.admin || null);
  const [loading, setLoading] = useState(Boolean(auth?.token));
  const [loadError, setLoadError] = useState('');
  const [liveAt, setLiveAt] = useState(null);

  const [bedDraft, setBedDraft] = useState(() => makeBedDraft(auth?.hospital));
  const [bedDirty, setBedDirty] = useState(false);
  const [oxygenDraft, setOxygenDraft] = useState(() => makeOxygenDraft(auth?.hospital));
  const [oxygenDirty, setOxygenDirty] = useState(false);
  const [contactDraft, setContactDraft] = useState(() => makeContactDraft(auth?.hospital));
  const [contactDirty, setContactDirty] = useState(false);
  const [profileDraft, setProfileDraft] = useState(() => makeProfileDraft(auth?.hospital));
  const [profileDirty, setProfileDirty] = useState(false);

  const [saving, setSaving] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [openingDocument, setOpeningDocument] = useState(false);

  const bedDirtyRef = useRef(false);
  const oxygenDirtyRef = useRef(false);
  const contactDirtyRef = useRef(false);
  const profileDirtyRef = useRef(false);

  const markBed = (dirty = true) => {
    bedDirtyRef.current = dirty;
    setBedDirty(dirty);
  };
  const markOxygen = (dirty = true) => {
    oxygenDirtyRef.current = dirty;
    setOxygenDirty(dirty);
  };
  const markContact = (dirty = true) => {
    contactDirtyRef.current = dirty;
    setContactDirty(dirty);
  };
  const markProfile = (dirty = true) => {
    profileDirtyRef.current = dirty;
    setProfileDirty(dirty);
  };

  const applyServerHospital = useCallback(
    (next) => {
      setHospital(next);
      updateSessionHospital(next);
      if (!bedDirtyRef.current) setBedDraft(makeBedDraft(next));
      if (!oxygenDirtyRef.current) setOxygenDraft(makeOxygenDraft(next));
      if (!contactDirtyRef.current) setContactDraft(makeContactDraft(next));
      if (!profileDirtyRef.current) setProfileDraft(makeProfileDraft(next));
    },
    [updateSessionHospital]
  );

  useEffect(() => {
    if (!auth?.token) {
      navigate('/login', { replace: true });
    }
  }, [auth?.token, navigate]);

  useEffect(() => {
    if (!auth?.token) return undefined;
    let cancelled = false;
    setLoading(true);
    api
      .me(auth.token)
      .then((response) => {
        if (cancelled) return;
        setAdmin(response.data.admin);
        applyServerHospital(response.data.hospital);
        setLoadError('');
      })
      .catch((error) => {
        if (cancelled) return;
        if (error?.status === 401) {
          logout();
          navigate('/login', { replace: true });
          return;
        }
        setLoadError(error?.message || t('dash.loadError'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [auth?.token, applyServerHospital, logout, navigate, t]);

  useHospitalUpdates((payload) => {
    if (!payload || !hospital?.id || payload.id !== hospital.id) return;
    setHospital((prev) => ({ ...prev, ...payload }));
    updateSessionHospital({ ...hospital, ...payload });
    setLiveAt(Date.now());
    if (!bedDirtyRef.current) setBedDraft(makeBedDraft(payload));
    if (!oxygenDirtyRef.current) setOxygenDraft(makeOxygenDraft(payload));
    if (!contactDirtyRef.current) setContactDraft(makeContactDraft(payload));
    if (!profileDirtyRef.current) setProfileDraft(makeProfileDraft(payload));
  });

  const approvalPending = hospital?.registration?.status === 'pending';

  useEffect(() => {
    if (!auth?.token || !approvalPending) return undefined;
    const timer = window.setInterval(() => {
      api
        .me(auth.token)
        .then((response) => {
          setAdmin(response.data.admin);
          applyServerHospital(response.data.hospital);
        })
        .catch((error) => {
          if (error?.status === 401 || error?.status === 404) {
            logout();
            navigate('/login', { replace: true });
          }
        });
    }, 30000);
    return () => window.clearInterval(timer);
  }, [auth?.token, approvalPending, applyServerHospital, logout, navigate]);

  const updateBed = (key, field, value) => {
    const number = Math.max(0, Number(value) || 0);
    setBedDraft((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: number },
    }));
    markBed();
  };

  const adjustBed = (key, field, delta) => {
    setBedDraft((prev) => {
      const current = prev[key];
      const total = field === 'available' ? Math.max(current.total, 0) : null;
      let value = Number(current[field]) + delta;
      value = Math.max(0, value);
      if (field === 'available' && total !== null) value = Math.min(total, value);
      return { ...prev, [key]: { ...current, [field]: value } };
    });
    markBed();
  };

  const saveBeds = async () => {
    const invalid = BED_KEYS.find((key) => Number(bedDraft[key].available) > Number(bedDraft[key].total));
    if (invalid) {
      setFormErrors({ beds: t('dash.invalidBeds') });
      pushToast(t('dash.invalidBeds'), 'danger');
      return;
    }
    setFormErrors((prev) => ({ ...prev, beds: '' }));
    setSaving('beds');
    try {
      const response = await api.updateBeds(hospital.id, bedDraft, auth.token);
      markBed(false);
      applyServerHospital(response.data);
      pushToast(t('dash.bedsUpdated'), 'ok');
    } catch (error) {
      pushToast(error?.message || t('dash.saveError'), 'danger');
    } finally {
      setSaving('');
    }
  };

  const saveOxygen = async () => {
    setSaving('oxygen');
    try {
      const response = await api.updateOxygen(hospital.id, oxygenDraft, auth.token);
      markOxygen(false);
      applyServerHospital(response.data);
      pushToast(t('dash.oxygenUpdated'), 'ok');
    } catch (error) {
      pushToast(error?.message || t('dash.saveError'), 'danger');
    } finally {
      setSaving('');
    }
  };

  const updateContact = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setContactDraft((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => ({ ...prev, [key]: '' }));
    markContact();
  };

  const validateContacts = () => {
    const next = {};
    if (!isValidIndianPhone(contactDraft.receptionPhone)) next.receptionPhone = t('dash.errors.phone');
    ['alternatePhone', 'emergencyPhone', 'ambulancePhone', 'mainLinePhone', 'whatsapp'].forEach((key) => {
      if (contactDraft[key] && !isValidIndianPhone(contactDraft[key])) next[key] = t('dash.errors.phone');
    });
    if (!TIME_RE.test(contactDraft.open)) next.open = t('dash.errors.timing');
    if (!TIME_RE.test(contactDraft.close)) next.close = t('dash.errors.timing');
    setFormErrors((prev) => ({ ...prev, ...next }));
    return Object.keys(next).length === 0;
  };

  const saveContacts = async () => {
    if (!validateContacts()) {
      pushToast(t('dash.errors.phone'), 'danger');
      return;
    }
    setSaving('contacts');
    const payload = {
      reception: {
        phone: contactDraft.receptionPhone.trim(),
        alternatePhone: contactDraft.alternatePhone.trim(),
        receptionistName: contactDraft.receptionistName.trim(),
        whatsapp: contactDraft.whatsapp.trim(),
        is24x7: contactDraft.is24x7,
        timings: { open: contactDraft.open, close: contactDraft.close },
      },
      emergencyWard: { phone: contactDraft.emergencyPhone.trim() },
      ambulance: { phone: contactDraft.ambulancePhone.trim() },
      mainLine: { phone: contactDraft.mainLinePhone.trim() },
    };
    try {
      const response = await api.updateContacts(hospital.id, payload, auth.token);
      markContact(false);
      applyServerHospital(response.data);
      pushToast(t('dash.contactsUpdated'), 'ok');
    } catch (error) {
      pushToast(error?.message || t('dash.saveError'), 'danger');
    } finally {
      setSaving('');
    }
  };

  const verifyContacts = async () => {
    setSaving('verify');
    try {
      const response = await api.verifyContacts(hospital.id, auth.token);
      markContact(false);
      applyServerHospital(response.data);
      pushToast(t('dash.verifiedToast'), 'ok');
    } catch (error) {
      pushToast(error?.message || t('dash.saveError'), 'danger');
    } finally {
      setSaving('');
    }
  };

  const openRegistrationDocument = async () => {
    setOpeningDocument(true);
    try {
      const blob = await api.registrationDocument(auth.token);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener');
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      pushToast(error?.message || t('dash.documentError'), 'danger');
    } finally {
      setOpeningDocument(false);
    }
  };

  const registration = hospital?.registration || null;
  const registrationTone =
    registration?.status === 'verified' ? TONES.ok : registration?.status === 'rejected' ? TONES.danger : TONES.warn;
  const registrationStatusLabel =
    registration?.status === 'verified'
      ? t('dash.registrationVerified')
      : registration?.status === 'rejected'
        ? t('dash.registrationRejected')
        : t('dash.registrationPending');

  const toggleProfileSpecialty = (specialty) => {
    setProfileDraft((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter((item) => item !== specialty)
        : [...prev.specialties, specialty],
    }));
    markProfile();
  };

  const updateDoctor = (index, key, value) => {
    setProfileDraft((prev) => ({
      ...prev,
      doctors: prev.doctors.map((doctor, doctorIndex) =>
        doctorIndex === index ? { ...doctor, [key]: value } : doctor
      ),
    }));
    markProfile();
  };

  const addDoctor = () => {
    setProfileDraft((prev) => ({
      ...prev,
      doctors: [...prev.doctors, { name: '', specialty: '', available: true }],
    }));
    markProfile();
  };

  const removeDoctor = (index) => {
    setProfileDraft((prev) => ({
      ...prev,
      doctors: prev.doctors.filter((_, doctorIndex) => doctorIndex !== index),
    }));
    markProfile();
  };

  const saveProfile = async () => {
    const doctors = profileDraft.doctors
      .filter((doctor) => doctor.name.trim() || doctor.specialty.trim())
      .map((doctor) => ({
        name: doctor.name.trim(),
        specialty: doctor.specialty.trim(),
        available: Boolean(doctor.available),
      }));
    if (doctors.some((doctor) => doctor.name.length < 2 || doctor.specialty.length < 2)) {
      pushToast(t('dash.errors.required'), 'danger');
      return;
    }
    setSaving('profile');
    try {
      const response = await api.updateProfile(
        hospital.id,
        {
          specialties: profileDraft.specialties,
          doctorsOnDuty: doctors,
          is24x7: profileDraft.is24x7,
          ambulanceAvailable: profileDraft.ambulanceAvailable,
        },
        auth.token
      );
      markProfile(false);
      applyServerHospital(response.data);
      pushToast(t('dash.profileUpdated'), 'ok');
    } catch (error) {
      pushToast(error?.message || t('dash.saveError'), 'danger');
    } finally {
      setSaving('');
    }
  };

  const reload = () => {
    setLoading(true);
    api
      .me(auth.token)
      .then((response) => {
        setAdmin(response.data.admin);
        applyServerHospital(response.data.hospital);
        setLoadError('');
      })
      .catch((error) => setLoadError(error?.message || t('dash.loadError')))
      .finally(() => setLoading(false));
  };

  if (!auth?.token) return null;

  if (!hospital) {
    return (
      <div className="auth-shell grid min-h-screen place-items-center p-6">
        <div className="panel w-full max-w-md p-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-danger/30 bg-danger/10 text-danger">
            <ShieldAlert size={26} />
          </span>
          <h1 className="mt-4 text-lg font-bold text-body">{t('dash.loadError')}</h1>
          {loadError ? <p className="mt-1 text-sm text-muted">{loadError}</p> : null}
          <div className="mt-5 flex justify-center gap-2">
            <button type="button" onClick={reload} className="btn-outline text-xs">
              <RefreshCw size={15} /> {t('common.retry')}
            </button>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="btn-primary text-xs"
            >
              <LogOut size={15} /> {t('nav.login')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totals = BED_KEYS.reduce(
    (acc, key) => {
      acc.total += Number(hospital.beds?.[key]?.total) || 0;
      acc.available += Number(hospital.beds?.[key]?.available) || 0;
      return acc;
    },
    { total: 0, available: 0 }
  );
  const occupancy = totals.total ? Math.round(((totals.total - totals.available) / totals.total) * 100) : 0;
  const bedTone = occupancy >= 90 ? TONES.danger : occupancy >= 70 ? TONES.warn : TONES.ok;
  const oxygenTone =
    hospital.oxygenStatus === 'available' ? TONES.ok : hospital.oxygenStatus === 'limited' ? TONES.warn : TONES.danger;

  return (
    <div className="min-h-screen bg-tactical">
      <header className="sticky top-0 z-50 border-b border-line/80 bg-bg/85 backdrop-blur-xl">
        <div className="container-page flex h-16 items-center gap-3">
          <Link to="/">
            <Logo size="md" />
          </Link>
          <span className="chip hidden border-accent/25 bg-accent/10 text-accent sm:inline-flex">
            <Activity size={11} /> {t('dash.title')}
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <span className={`chip hidden min-h-[34px] px-2.5 py-0 text-[10px] sm:inline-flex ${liveAt ? TONES.ok.chip : TONES.neutral.chip}`}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-ok" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-ok" />
              </span>
              <span className="hidden sm:inline">{t('dash.liveSync')}</span>
            </span>
            <button
              type="button"
              onClick={toggleTheme}
              className="icon-btn h-10 min-h-[40px] w-10 min-w-[40px]"
              aria-label={theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              type="button"
              onClick={toggleLargeText}
              className={`icon-btn h-10 min-h-[40px] w-10 min-w-[40px] ${largeText ? 'text-accent' : ''}`}
              aria-label={t('common.largeText')}
            >
              <Type size={16} />
            </button>
            <button type="button" onClick={toggleLang} className="chip min-h-[40px] px-2.5 font-bold text-body" aria-label={t('common.language')}>
              {lang === 'en' ? 'EN' : 'हिं'}
            </button>
            <Link
              to={`/hospital/${hospital.id}`}
              className="icon-btn hidden h-10 min-h-[40px] w-10 min-w-[40px] sm:inline-flex"
              title={t('results.viewHospital')}
              aria-label={t('results.viewHospital')}
            >
              <ExternalLink size={16} />
            </Link>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="btn-outline min-h-[40px] px-3 text-xs"
              aria-label={t('nav.logout')}
              title={t('nav.logout')}
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">{t('nav.logout')}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container-page py-5 lg:py-6">
        {loadError ? (
          <div className="mb-3 rounded-xl border border-warn/35 bg-warn/10 px-3.5 py-2.5 text-xs text-warn">
            {loadError} — <button type="button" onClick={reload} className="font-bold underline">{t('common.retry')}</button>
          </div>
        ) : null}

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="label-xs text-accent">{t('dash.subtitle')}</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-body sm:text-3xl">{hospital.name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
              <span className="inline-flex items-center gap-1"><Building2 size={12} /> {hospital.type}</span>
              <span className="inline-flex items-center gap-1"><MapPin size={12} /> {hospital.city}, {hospital.state}</span>
              <span className="inline-flex items-center gap-1"><Clock3 size={12} /> {t('dash.lastSync', { time: timeAgo(hospital.lastUpdated, t) })}</span>
            </p>
            {admin ? (
              <p className="mt-1 text-[11px] text-muted">
                {t('dash.welcome', { name: admin.name })} · {admin.designation || t('dash.admin')}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {hospital.contacts?.verifiedRecently ? (
              <span className={`chip min-h-[32px] px-3 py-0 text-[10px] ${TONES.ok.chip}`}>
                <BadgeCheck size={12} /> {t('common.verified')}
              </span>
            ) : (
              <span className={`chip min-h-[32px] px-3 py-0 text-[10px] ${TONES.warn.chip}`}>
                <ShieldAlert size={12} /> {t('results.unverified')}
              </span>
            )}
            {hospital.isDemo ? <span className="chip min-h-[32px] border-dashed px-3 py-0 text-[10px]">{t('common.demo')}</span> : null}
            <Link to={`/hospital/${hospital.id}`} className="btn-outline min-h-[36px] px-3 text-[10px]">
              {t('results.viewHospital')} <ExternalLink size={12} />
            </Link>
          </div>
        </div>

        {registration?.status === 'pending' ? (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-warn/40 bg-warn/10 px-4 py-3 text-warn">
            <Clock3 size={16} className="mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold">{t('dash.approvalBannerTitle')}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed">{t('dash.approvalBannerBody')}</p>
            </div>
          </div>
        ) : null}

        {hospital.isStale ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-warn/40 bg-warn/10 px-4 py-3 text-xs text-warn">
            <ShieldAlert size={15} />
            <span className="font-semibold">{t('dash.staleBanner')}</span>
            <button type="button" onClick={() => document.getElementById('capacity')?.scrollIntoView({ behavior: 'smooth' })} className="ml-auto font-bold underline">
              {t('dash.capacity')} →
            </button>
          </div>
        ) : null}

        {loading ? (
          <p className="mt-2 flex items-center gap-1.5 text-[10px] text-accent">
            <Loader2 size={11} className="animate-spin" /> {t('common.loading')}
          </p>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {[
            { label: t('dash.totalBeds'), value: totals.total, tone: 'text-body', icon: BedDouble },
            { label: t('dash.availableBeds'), value: totals.available, tone: 'text-ok', icon: Activity },
            { label: t('dash.icuFree'), value: hospital.beds?.icu?.available || 0, tone: 'text-accent', icon: Stethoscope },
            { label: t('dash.oxygenCylinders'), value: hospital.oxygenCylinders || 0, tone: oxygenTone.text, icon: Wind },
          ].map(({ label, value, tone, icon: Icon }) => (
            <div key={label} className="panel px-3.5 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="label-xs">{label}</p>
                <Icon size={13} className={tone} />
              </div>
              <p className={`mt-1.5 font-display text-2xl font-black ${tone}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-4">
            <section id="capacity" className="panel p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="label-xs text-accent">{t('dash.capacity')}</p>
                  <h2 className="mt-1 text-lg font-bold text-body">{t('results.bedBoard')}</h2>
                  <p className="mt-0.5 text-xs text-muted">{t('dash.capacitySub')}</p>
                </div>
                <span className={`chip min-h-[30px] px-2.5 py-0 text-[10px] ${bedTone.chip}`}>
                  {t('dash.occupancy')} {occupancy}%
                </span>
              </div>

              <div className="mt-3 space-y-2">
                {BED_KEYS.map((key) => {
                  const draft = bedDraft[key];
                  const ratio = draft.total ? Math.min(100, Math.round((draft.available / draft.total) * 100)) : 0;
                  const unitTone = ratio >= 30 ? TONES.ok : ratio >= 10 ? TONES.warn : TONES.danger;
                  return (
                    <div key={key} className="rounded-xl border border-line bg-elevated/40 p-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="min-w-[92px] flex-1">
                          <p className="flex items-center gap-1.5 text-xs font-bold text-body">
                            <BedDouble size={13} className="text-muted" /> {t(BED_LABEL_KEYS[key])}
                          </p>
                          <div className="mt-1 h-1 overflow-hidden rounded-full bg-line">
                            <div className={`h-full rounded-full ${unitTone.bar}`} style={{ width: `${Math.max(2, ratio)}%` }} />
                          </div>
                        </div>

                        <label className="flex items-center gap-1.5 text-[10px] text-muted">
                          {t('dash.total')}
                          <input
                            type="number"
                            min="0"
                            max="10000"
                            value={draft.total}
                            onChange={(event) => updateBed(key, 'total', event.target.value)}
                            className="field-sm w-[72px] px-2 py-1 text-center text-xs"
                          />
                        </label>
                        <label className="flex items-center gap-1.5 text-[10px] text-muted">
                          {t('dash.available')}
                          <input
                            type="number"
                            min="0"
                            max="10000"
                            value={draft.available}
                            onChange={(event) => updateBed(key, 'available', event.target.value)}
                            className="field-sm w-[72px] px-2 py-1 text-center text-xs"
                          />
                        </label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => adjustBed(key, 'available', -1)}
                            className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-line bg-surface text-body transition hover:border-danger/50 hover:text-danger"
                            aria-label={`${t('dash.available')} -1 ${t(BED_LABEL_KEYS[key])}`}
                          >
                            <Minus size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => adjustBed(key, 'available', 1)}
                            className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-ok/30 bg-ok/10 text-ok transition hover:border-ok/60"
                            aria-label={`${t('dash.available')} +1 ${t(BED_LABEL_KEYS[key])}`}
                          >
                            <Plus size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {formErrors.beds ? <p className="mt-2 text-[11px] font-semibold text-danger">{formErrors.beds}</p> : null}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                <p className="flex items-center gap-1.5 text-[10px] text-muted">
                  <Activity size={11} className="text-accent" /> {t('dash.tip')}
                </p>
                <SaveButton
                  busy={saving === 'beds'}
                  label={t('dash.saveBeds')}
                  savingLabel={t('common.saving')}
                  onClick={saveBeds}
                />
              </div>
              {bedDirty ? <p className="mt-1 text-right text-[10px] text-warn">Unsaved changes</p> : null}
            </section>

            <section className="panel p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="label-xs text-accent">{t('dash.oxygen')}</p>
                  <h2 className="mt-1 text-lg font-bold text-body">{t('dash.oxygenSub')}</h2>
                </div>
                <span className={`chip min-h-[30px] px-2.5 py-0 text-[10px] ${oxygenTone.chip}`}>
                  <Wind size={11} /> {t(`oxygen.${hospital.oxygenStatus}`)}
                </span>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="label-xs">{t('dash.oxygenStatus')}</p>
                  <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                    {OXYGEN_STATUS.map((status) => {
                      const active = oxygenDraft.oxygenStatus === status;
                      const tone = status === 'available' ? TONES.ok : status === 'limited' ? TONES.warn : TONES.danger;
                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() => {
                            setOxygenDraft((prev) => ({ ...prev, oxygenStatus: status }));
                            markOxygen();
                          }}
                          className={`min-h-[44px] rounded-lg border px-1.5 text-[10px] font-bold capitalize transition ${
                            active ? tone.chip : 'border-line bg-elevated/40 text-muted hover:text-body'
                          }`}
                        >
                          {t(`oxygen.${status}`)}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <LabeledField label={t('dash.cylinders')}>
                  <input
                    type="number"
                    min="0"
                    max="100000"
                    value={oxygenDraft.oxygenCylinders}
                    onChange={(event) => {
                      setOxygenDraft((prev) => ({ ...prev, oxygenCylinders: Math.max(0, Number(event.target.value) || 0) }));
                      markOxygen();
                    }}
                    className="field-sm"
                  />
                </LabeledField>
              </div>

              <div className="mt-3 flex justify-end border-t border-line pt-3">
                <SaveButton
                  busy={saving === 'oxygen'}
                  label={t('dash.saveOxygen')}
                  savingLabel={t('common.saving')}
                  onClick={saveOxygen}
                />
              </div>
              {oxygenDirty ? <p className="mt-1 text-right text-[10px] text-warn">Unsaved changes</p> : null}
            </section>

            <section className="panel p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="label-xs text-accent">{t('dash.contacts')}</p>
                  <h2 className="mt-1 text-lg font-bold text-body">{t('dash.contactsSub')}</h2>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {hospital.contacts?.lastVerified ? (
                    <span className="chip min-h-[28px] px-2.5 py-0 text-[10px]">
                      <ShieldCheck size={10} className="text-ok" /> {t('dash.verifiedOn', { date: formatDate(hospital.contacts.lastVerified, lang) })}
                    </span>
                  ) : (
                    <span className="chip min-h-[28px] px-2.5 py-0 text-[10px] text-warn">
                      <ShieldAlert size={10} /> {t('dash.neverVerified')}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={verifyContacts}
                    disabled={saving === 'verify'}
                    className="btn-outline min-h-[36px] px-2.5 text-[10px]"
                  >
                    {saving === 'verify' ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
                    {t('dash.verifyNow')}
                  </button>
                </div>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <LabeledField label={`${t('auth.receptionPhone')} *`} error={formErrors.receptionPhone}>
                  <div className="relative">
                    <input value={contactDraft.receptionPhone} onChange={updateContact('receptionPhone')} className="field-sm pr-9" inputMode="tel" />
                    <span className="absolute right-1 top-1/2 -translate-y-1/2">
                      <CopyButton value={contactDraft.receptionPhone} compact />
                    </span>
                  </div>
                </LabeledField>
                <LabeledField label={t('auth.alternatePhone')} error={formErrors.alternatePhone} hint={t('dash.privacyBody')}>
                  <input value={contactDraft.alternatePhone} onChange={updateContact('alternatePhone')} className="field-sm" inputMode="tel" />
                </LabeledField>
                <LabeledField label={t('auth.receptionistName')}>
                  <input value={contactDraft.receptionistName} onChange={updateContact('receptionistName')} className="field-sm" />
                </LabeledField>
                <LabeledField label={t('auth.whatsapp')} error={formErrors.whatsapp}>
                  <input value={contactDraft.whatsapp} onChange={updateContact('whatsapp')} className="field-sm" inputMode="tel" />
                </LabeledField>
                <LabeledField label={t('auth.emergencyPhone')} error={formErrors.emergencyPhone}>
                  <input value={contactDraft.emergencyPhone} onChange={updateContact('emergencyPhone')} className="field-sm" inputMode="tel" />
                </LabeledField>
                <LabeledField label={t('auth.ambulancePhone')} error={formErrors.ambulancePhone}>
                  <input value={contactDraft.ambulancePhone} onChange={updateContact('ambulancePhone')} className="field-sm" inputMode="tel" />
                </LabeledField>
                <LabeledField label={t('auth.mainLinePhone')} error={formErrors.mainLinePhone} className="sm:col-span-2">
                  <input value={contactDraft.mainLinePhone} onChange={updateContact('mainLinePhone')} className="field-sm" inputMode="tel" />
                </LabeledField>
              </div>

              <div className="mt-3 rounded-xl border border-line bg-elevated/30 p-3">
                <label className="flex items-center gap-2 text-xs text-body">
                  <input type="checkbox" checked={contactDraft.is24x7} onChange={updateContact('is24x7')} className="h-4 w-4 accent-accent" />
                  {t('auth.reception24x7')}
                </label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <LabeledField label={t('auth.openTime')} error={formErrors.open}>
                    <input type="time" value={contactDraft.open} onChange={updateContact('open')} className="field-sm" />
                  </LabeledField>
                  <LabeledField label={t('auth.closeTime')} error={formErrors.close}>
                    <input type="time" value={contactDraft.close} onChange={updateContact('close')} className="field-sm" />
                  </LabeledField>
                </div>
              </div>

              <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-relaxed text-muted">
                <ShieldCheck size={12} className="mt-0.5 shrink-0 text-ok" /> {t('auth.publicNote')}
              </p>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                <span className="text-[10px] text-muted">{t('dash.verifyNote')}</span>
                <SaveButton
                  busy={saving === 'contacts'}
                  label={t('dash.saveContacts')}
                  savingLabel={t('common.saving')}
                  onClick={saveContacts}
                />
              </div>
              {contactDirty ? <p className="mt-1 text-right text-[10px] text-warn">Saving a new phone number will reset verification.</p> : null}
            </section>
          </div>

          <div className="space-y-4">
            <section className="panel p-4 sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="label-xs text-accent">{t('dash.profile')}</p>
                  <h2 className="mt-1 text-lg font-bold text-body">{t('dash.profileSub')}</h2>
                </div>
                <Stethoscope size={16} className="text-accent" />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 rounded-lg border border-line bg-elevated/40 px-2.5 py-2 text-[10px] text-body">
                  <input
                    type="checkbox"
                    checked={profileDraft.is24x7}
                    onChange={(event) => {
                      setProfileDraft((prev) => ({ ...prev, is24x7: event.target.checked }));
                      markProfile();
                    }}
                    className="h-4 w-4 accent-accent"
                  />
                  {t('auth.is24x7')}
                </label>
                <label className="flex items-center gap-2 rounded-lg border border-line bg-elevated/40 px-2.5 py-2 text-[10px] text-body">
                  <input
                    type="checkbox"
                    checked={profileDraft.ambulanceAvailable}
                    onChange={(event) => {
                      setProfileDraft((prev) => ({ ...prev, ambulanceAvailable: event.target.checked }));
                      markProfile();
                    }}
                    className="h-4 w-4 accent-accent"
                  />
                  {t('auth.ambulanceAvailable')}
                </label>
              </div>

              <div className="mt-3">
                <p className="label-xs">{t('auth.specialties')}</p>
                <div className="thin-scrollbar mt-1.5 flex max-h-40 flex-wrap gap-1 overflow-y-auto rounded-lg border border-line bg-elevated/30 p-2">
                  {SPECIALTIES.map((specialty) => {
                    const active = profileDraft.specialties.includes(specialty);
                    return (
                      <button
                        key={specialty}
                        type="button"
                        onClick={() => toggleProfileSpecialty(specialty)}
                        className={`chip min-h-[26px] px-2 py-0 text-[9px] font-semibold transition ${
                          active ? 'border-accent/50 bg-accent/10 text-accent' : 'hover:border-accent/30'
                        }`}
                      >
                        {t(`specialty.${specialty}`)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="label-xs">{t('dash.doctors')}</p>
                  <button type="button" onClick={addDoctor} className="chip min-h-[28px] px-2 py-0 text-[10px] hover:border-accent/40 hover:text-accent">
                    <Plus size={10} /> {t('dash.addDoctor')}
                  </button>
                </div>
                <div className="mt-1.5 space-y-1.5">
                  {profileDraft.doctors.map((doctor, index) => (
                    <div key={`doctor-${index}`} className="rounded-lg border border-line bg-elevated/40 p-2">
                      <div className="flex items-center gap-1.5">
                        <input
                          value={doctor.name}
                          onChange={(event) => updateDoctor(index, 'name', event.target.value)}
                          placeholder={t('dash.doctorName')}
                          className="field-sm min-h-[34px] flex-1 px-2 text-[11px]"
                        />
                        <button
                          type="button"
                          onClick={() => removeDoctor(index)}
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-danger/10 hover:text-danger"
                          aria-label={t('common.remove')}
                        >
                          <X size={13} />
                        </button>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <input
                          value={doctor.specialty}
                          onChange={(event) => updateDoctor(index, 'specialty', event.target.value)}
                          placeholder={t('dash.doctorSpecialty')}
                          className="field-sm min-h-[32px] flex-1 px-2 text-[11px]"
                        />
                        <label className="flex shrink-0 items-center gap-1 text-[9px] text-muted">
                          <input
                            type="checkbox"
                            checked={doctor.available}
                            onChange={(event) => updateDoctor(index, 'available', event.target.checked)}
                            className="h-3.5 w-3.5 accent-accent"
                          />
                          {t('dash.availableNow')}
                        </label>
                      </div>
                    </div>
                  ))}
                  {!profileDraft.doctors.length ? (
                    <p className="rounded-lg border border-dashed border-line px-2.5 py-3 text-center text-[10px] text-muted">
                      {t('dash.addDoctor')}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 flex justify-end border-t border-line pt-3">
                <SaveButton
                  busy={saving === 'profile'}
                  label={t('dash.saveProfile')}
                  savingLabel={t('common.saving')}
                  onClick={saveProfile}
                />
              </div>
              {profileDirty ? <p className="mt-1 text-right text-[10px] text-warn">Unsaved changes</p> : null}
            </section>

            <section className="panel p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="label-xs flex items-center gap-1.5">
                    <FileCheck2 size={11} className="text-accent" /> {t('dash.registration')}
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-body">{t('dash.registrationSub')}</h2>
                </div>
                {registration ? (
                  <span className={`chip min-h-[28px] px-2.5 py-0 text-[10px] ${registrationTone.chip}`}>
                    <FileCheck2 size={10} /> {registrationStatusLabel}
                  </span>
                ) : (
                  <span className="chip min-h-[28px] border-dashed px-2.5 py-0 text-[10px]">
                    {t('dash.registrationMissing')}
                  </span>
                )}
              </div>

              {registration ? (
                <>
                  <p className="mt-3 truncate text-xs font-semibold text-body">{registration.document.originalName}</p>
                  <p className="mt-0.5 text-[10px] text-muted">
                    {formatDate(registration.uploadedAt, lang)} · {formatFileSize(registration.document.size)}
                  </p>
                  <button
                    type="button"
                    onClick={openRegistrationDocument}
                    disabled={openingDocument}
                    className="btn-outline mt-3 w-full min-h-[40px] text-[10px]"
                  >
                    {openingDocument ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
                    {t('dash.viewDocument')}
                  </button>
                  {registration.note ? (
                    <p className="mt-2 rounded-lg border border-danger/30 bg-danger/10 px-2.5 py-1.5 text-[10px] leading-relaxed text-danger">
                      {t('dash.reviewNote')}: {registration.note}
                    </p>
                  ) : registration.status !== 'verified' ? (
                    <p className="mt-2 text-[10px] leading-relaxed text-muted">{t('dash.registrationPendingHint')}</p>
                  ) : null}
                </>
              ) : (
                <p className="mt-2 text-[10px] leading-relaxed text-muted">{t('dash.registrationMissingHint')}</p>
              )}
            </section>

            <section className="panel p-4 sm:p-5">
              <p className="label-xs flex items-center gap-1.5">
                <UserRound size={11} className="text-accent" /> {t('dash.admin')}
              </p>
              <p className="mt-2 text-sm font-bold text-body">{admin?.name || '—'}</p>
              <p className="text-[11px] text-muted">{admin?.email}</p>
              <p className="text-[11px] text-muted">{admin?.designation}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                <div className="rounded-lg border border-line/70 bg-elevated/40 px-2 py-1.5">
                  <p className="text-muted">{t('dash.hospitalProfile')}</p>
                  <p className="mt-0.5 truncate font-semibold text-body">{hospital.type}</p>
                </div>
                <div className="rounded-lg border border-line/70 bg-elevated/40 px-2 py-1.5">
                  <p className="text-muted">{t('dash.lastVerifiedLabel')}</p>
                  <p className="mt-0.5 truncate font-semibold text-body">
                    {hospital.contacts?.verifiedRecently ? t('common.verified') : t('results.unverified')}
                  </p>
                </div>
              </div>
              <p className="mt-3 flex items-start gap-1.5 rounded-lg border border-line bg-elevated/30 px-2.5 py-2 text-[10px] leading-relaxed text-muted">
                <ShieldCheck size={12} className="mt-0.5 shrink-0 text-ok" /> {t('dash.privacyBody')}
              </p>
              <Link to={`/hospital/${hospital.id}`} className="btn-outline mt-3 w-full min-h-[40px] text-[10px]">
                <ExternalLink size={12} /> {t('results.viewHospital')}
              </Link>
            </section>

            <section className="panel p-4">
              <p className="label-xs">{t('dash.lastUpdatedLabel')}</p>
              <p className="mt-1 text-xs font-semibold text-body">{timeAgo(hospital.lastUpdated, t)}</p>
              <p className="mt-0.5 text-[10px] text-muted">
                {hospital.contacts?.lastVerified
                  ? t('dash.verifiedOn', { date: formatDate(hospital.contacts.lastVerified, lang) })
                  : t('dash.neverVerified')}
              </p>
              <p className="mt-3 flex items-center gap-1.5 text-[10px] text-muted">
                <MapPin size={11} /> {hospital.address}, {hospital.city}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-[10px] text-muted">
                <Phone size={11} /> {formatPhone(hospital.contacts?.reception?.phone)}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-[10px] text-muted">
                <Ambulance size={11} /> {hospital.ambulanceAvailable ? t('hospital.ambulanceAvailable') : t('hospital.ambulanceUnavailable')}
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
