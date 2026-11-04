import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Ambulance,
  ArrowLeft,
  BedDouble,
  Clock3,
  MapPin,
  Navigation,
  Phone,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Stethoscope,
  Wind,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { usePublicHospital } from '../hooks/usePublicHospital.js';
import { BED_KEYS, BED_LABEL_KEYS } from '../lib/constants.js';
import { bedTone, levelLabelKey, oxygenMeta, TONES } from '../lib/status.js';
import {
  directionsUrl,
  formatDistance,
  formatPhone,
  telHref,
  timeAgo,
  whatsappHref,
  whatsappShareHref,
} from '../lib/format.js';
import { Header } from '../components/layout/Header.jsx';
import { Footer } from '../components/layout/Footer.jsx';
import { OfflineBanner } from '../components/layout/OfflineBanner.jsx';
import { CopyButton } from '../components/ui/CopyButton.jsx';
import { HospitalMap } from '../components/HospitalMap.jsx';

function ratioTone(available, total) {
  if (!total) return TONES.neutral;
  const ratio = available / total;
  if (ratio >= 0.3) return TONES.ok;
  if (ratio >= 0.1) return TONES.warn;
  return TONES.danger;
}

export function HospitalPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, lang, location, online } = useApp();

  const latParam = searchParams.get('lat');
  const lngParam = searchParams.get('lng');
  const latRaw = latParam?.trim() ? Number(latParam) : Number.NaN;
  const lngRaw = lngParam?.trim() ? Number(lngParam) : Number.NaN;
  const lat = Number.isFinite(latRaw) ? latRaw : location.lat;
  const lng = Number.isFinite(lngRaw) ? lngRaw : location.lng;

  const { hospital, loading, error, cached, reload } = usePublicHospital(id, { lat, lng });

  if (loading && !hospital) {
    return (
      <div className="min-h-screen bg-tactical">
        <Header />
        <main className="container-page py-8">
          <div className="skeleton h-6 w-32" />
          <div className="mt-4 skeleton h-40 w-full rounded-2xl" />
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="skeleton h-64 rounded-2xl" />
            <div className="skeleton h-64 rounded-2xl" />
          </div>
        </main>
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="min-h-screen bg-tactical">
        <Header />
        <main className="container-page flex flex-col items-center gap-4 py-20 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl border border-danger/30 bg-danger/10 text-danger">
            <ShieldAlert size={26} />
          </span>
          <h1 className="text-xl font-bold text-body">{t('hospital.notFound')}</h1>
          <p className="max-w-md text-sm text-muted">{error?.message || t('hospital.loadError')}</p>
          <div className="flex gap-2">
            <button type="button" onClick={reload} className="btn-outline text-xs">
              {t('common.retry')}
            </button>
            <Link to="/" className="btn-accent text-xs">
              {t('nav.home')}
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const tone = bedTone(hospital.bedStatus);
  const oxygen = oxygenMeta(hospital.oxygenStatus, t);
  const reception = hospital.contacts?.reception || {};
  const closed = reception.isOpenNow === false;
  const emergencyPhone = hospital.contacts?.emergencyWard?.phone || '';
  const primaryPhone = closed && emergencyPhone ? emergencyPhone : reception.phone;
  const primaryIsEmergency = Boolean(closed && emergencyPhone);

  const contactRows = [
    { key: 'reception', label: t('results.reception'), phone: reception.phone, icon: Phone },
    { key: 'emergency', label: t('results.emergency'), phone: emergencyPhone, icon: Siren },
    { key: 'ambulance', label: t('results.ambulance'), phone: hospital.contacts?.ambulance?.phone, icon: Ambulance },
    { key: 'main', label: t('results.mainLine'), phone: hospital.contacts?.mainLine?.phone, icon: Phone },
  ].filter((row) => row.phone);

  const shareText = t('results.shareMessage', {
    name: hospital.name,
    phone: primaryPhone || '',
    maps: directionsUrl(hospital),
  });

  return (
    <div className="min-h-screen bg-tactical">
      <Header />

      <main className="container-page py-6">
        <button type="button" onClick={() => navigate(-1)} className="btn-ghost -ml-2 min-h-[40px] px-2 text-xs">
          <ArrowLeft size={15} /> {t('common.back')}
        </button>

        {!online || cached ? <OfflineBanner className="mt-3" cached={cached} /> : null}

        <section className="panel relative mt-3 overflow-hidden">
          <span className={`absolute inset-y-0 left-0 w-1.5 ${tone.bar}`} />
          <div className="p-5 pl-7 sm:p-7 sm:pl-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`chip min-h-[28px] px-2.5 py-0 text-[10px] ${TONES.accent.chip}`}>
                    {t(levelLabelKey(hospital.level))}
                  </span>
                  <span className="chip min-h-[28px] px-2.5 py-0 text-[10px]">{hospital.type}</span>
                  {hospital.isDemo ? <span className="chip min-h-[28px] border-dashed px-2.5 py-0 text-[10px]">{t('common.demo')}</span> : null}
                  {hospital.contacts?.verifiedRecently ? (
                    <span className={`chip min-h-[28px] px-2.5 py-0 text-[10px] ${TONES.ok.chip}`}>
                      <ShieldCheck size={10} /> {t('common.verified')}
                    </span>
                  ) : (
                    <span className={`chip min-h-[28px] px-2.5 py-0 text-[10px] ${TONES.warn.chip}`}>
                      <ShieldAlert size={10} /> {t('results.unverified')}
                    </span>
                  )}
                  {hospital.isStale ? (
                    <span className={`chip min-h-[28px] px-2.5 py-0 text-[10px] ${TONES.warn.chip}`}>
                      <Clock3 size={10} /> {t('results.stale')}
                    </span>
                  ) : null}
                </div>
                <h1 className="mt-3 text-2xl font-black tracking-tight text-body sm:text-3xl">{hospital.name}</h1>
                <p className="mt-2 flex items-start gap-1.5 text-sm text-muted">
                  <MapPin size={15} className="mt-0.5 shrink-0 text-accent" />
                  {hospital.address}, {hospital.city}, {hospital.state} · {hospital.pincode}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {t('results.updated', { time: timeAgo(hospital.lastUpdated, t) })}
                  {hospital.contacts?.verifiedRecently
                    ? ` · ${t('results.verifiedAt', { time: timeAgo(hospital.contacts.lastVerified, t) })}`
                    : ''}
                </p>
              </div>

              <div className="rounded-xl border border-line bg-elevated/50 px-4 py-3 text-right">
                <p className={`text-sm font-bold ${tone.text}`}>{t(levelLabelKey(hospital.level))}</p>
                <p className="mt-1 text-[11px] text-muted">
                  {hospital.is24x7 ? '24×7' : t('common.closed')} ·{' '}
                  {hospital.ambulanceAvailable ? t('hospital.ambulanceAvailable') : t('hospital.ambulanceUnavailable')}
                </p>
                {Number.isFinite(hospital.distanceKm) ? (
                  <p className="mt-1 text-[11px] text-muted">
                    {formatDistance(hospital.distanceKm)} {t('common.km')} · {hospital.etaMinutes} {t('common.min')}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {primaryPhone ? (
                <a
                  href={telHref(primaryPhone)}
                  className={`btn min-h-[52px] flex-1 gap-2 px-4 text-sm sm:flex-none sm:min-w-[200px] ${
                    primaryIsEmergency ? 'bg-brand text-white shadow-sos' : 'btn-primary'
                  }`}
                >
                  {primaryIsEmergency ? <Siren size={17} /> : <Phone size={17} />}
                  {primaryIsEmergency ? t('results.callEmergency') : t('results.callReception')}
                </a>
              ) : null}
              <a
                href={directionsUrl(hospital)}
                target="_blank"
                rel="noreferrer"
                className="btn-outline min-h-[52px] px-4 text-xs"
              >
                <Navigation size={16} /> {t('results.directions')}
              </a>
              <a
                href={whatsappShareHref(shareText)}
                target="_blank"
                rel="noreferrer"
                className="btn-outline min-h-[52px] border-ok/30 px-4 text-xs text-ok hover:border-ok/60 hover:text-ok"
              >
                <Share2 size={16} /> {t('hospital.share')}
              </a>
              {primaryPhone ? <CopyButton value={primaryPhone} className="min-h-[52px]" /> : null}
            </div>

            {closed && emergencyPhone ? (
              <p className={`mt-3 rounded-lg border px-3 py-2 text-xs font-semibold ${TONES.danger.chip}`}>
                {t('results.emergencyPriority')}
              </p>
            ) : null}
            {hospital.isStale ? (
              <p className={`mt-3 rounded-lg border px-3 py-2 text-xs ${TONES.warn.chip}`}>
                {t('results.staleHint')} · {timeAgo(hospital.lastUpdated, t)}
              </p>
            ) : null}
          </div>
        </section>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-4">
            <section className="panel p-5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="label-xs">{t('hospital.overview')}</p>
                  <h2 className="mt-1 text-lg font-bold text-body">{t('results.bedBoard')}</h2>
                </div>
                <span className={`chip min-h-[30px] px-2.5 py-0 text-[10px] ${tone.chip}`}>
                  {t('results.bedsAvailable', { n: hospital.availableBeds })} / {hospital.totalBeds}
                </span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-line">
                <div
                  className={`h-full rounded-full ${tone.bar}`}
                  style={{ width: `${Math.min(100, Math.max(2, 100 - hospital.occupancy))}%` }}
                />
              </div>
              <p className="mt-1 text-right text-[10px] text-muted">
                {t('results.occupancy', { n: hospital.occupancy })}
              </p>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {BED_KEYS.map((key) => {
                  const bed = hospital.beds?.[key] || { available: 0, total: 0 };
                  const unitTone = ratioTone(bed.available, bed.total);
                  const ratio = bed.total ? Math.round((bed.available / bed.total) * 100) : 0;
                  return (
                    <div key={key} className="rounded-xl border border-line/70 bg-elevated/40 px-3 py-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-muted">
                          <BedDouble size={12} /> {t(BED_LABEL_KEYS[key])}
                        </span>
                        <span className={`font-bold ${unitTone.text}`}>
                          {bed.available} <span className="font-medium text-muted">/ {bed.total}</span>
                        </span>
                      </div>
                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-line">
                        <div className={`h-full rounded-full ${unitTone.bar}`} style={{ width: `${Math.max(2, ratio)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className={`rounded-xl border px-3 py-2.5 ${oxygen.classes.border} ${oxygen.classes.soft}`}>
                  <p className="label-xs flex items-center gap-1">
                    <Wind size={10} /> {t('results.oxygen')}
                  </p>
                  <p className={`mt-1 text-sm font-bold ${oxygen.classes.text}`}>{oxygen.label}</p>
                  <p className="text-[10px] text-muted">{t('results.cylinders', { n: hospital.oxygenCylinders })}</p>
                </div>
                <div className="rounded-xl border border-line bg-elevated/40 px-3 py-2.5">
                  <p className="label-xs flex items-center gap-1">
                    <Clock3 size={10} /> {t('results.doctors')}
                  </p>
                  <p className="mt-1 text-sm font-bold text-body">
                    {(hospital.doctorsOnDuty || []).filter((doctor) => doctor.available).length} /{' '}
                    {(hospital.doctorsOnDuty || []).length}
                  </p>
                  <p className="text-[10px] text-muted">{t('dash.availableNow')}</p>
                </div>
              </div>
            </section>

            <section className="panel p-5">
              <p className="label-xs">{t('hospital.contactNumbers')}</p>
              <div className="mt-2.5 space-y-2">
                {contactRows.map((row) => {
                  const Icon = row.icon;
                  return (
                    <div key={row.key} className="flex items-center gap-2 rounded-xl border border-line/70 bg-elevated/40 px-3 py-2.5">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-accent/20 bg-accent/5 text-accent">
                        <Icon size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] uppercase tracking-wider text-muted">{row.label}</p>
                        <p className="text-sm font-bold text-body">{formatPhone(row.phone)}</p>
                      </div>
                      <CopyButton value={row.phone} compact />
                      <a
                        href={whatsappHref(row.phone)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ok transition hover:bg-ok/10"
                        aria-label={t('results.shareWhatsapp')}
                      >
                        <Share2 size={15} />
                      </a>
                      <a
                        href={telHref(row.phone)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-body transition hover:bg-accent/10 hover:text-accent"
                        aria-label={t('common.call')}
                      >
                        <Phone size={15} />
                      </a>
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 flex items-start gap-2 rounded-lg border border-line bg-elevated/30 px-3 py-2 text-[10px] leading-relaxed text-muted">
                <ShieldCheck size={13} className="mt-0.5 shrink-0 text-ok" />
                {t('dash.privacyBody')}
              </p>
            </section>

            <section className="panel overflow-hidden p-5">
              <p className="label-xs">{t('hospital.team')}</p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {(hospital.specialties || []).map((specialty) => (
                  <span key={specialty} className="chip min-h-[28px] px-2 py-0 text-[10px]">
                    {t(`specialty.${specialty}`)}
                  </span>
                ))}
              </div>
              {(hospital.doctorsOnDuty || []).length ? (
                <div className="mt-4 grid gap-1.5 sm:grid-cols-2">
                  {hospital.doctorsOnDuty.map((doctor) => (
                    <div
                      key={`${doctor.name}-${doctor.specialty}`}
                      className="flex items-center gap-2 rounded-lg border border-line/70 bg-elevated/40 px-3 py-2"
                    >
                      <Stethoscope size={14} className="shrink-0 text-accent" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-body">{doctor.name}</p>
                        <p className="truncate text-[10px] text-muted">{doctor.specialty}</p>
                      </div>
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${doctor.available ? 'bg-ok' : 'bg-muted'}`}
                        title={doctor.available ? t('dash.availableNow') : t('common.closed')}
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          </div>

          <div className="space-y-4">
            <section className="panel overflow-hidden">
              <div className="border-b border-line px-4 py-3">
                <p className="label-xs flex items-center gap-1">
                  <MapPin size={10} /> {t('results.directions')}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {formatDistance(hospital.distanceKm)} {t('common.km')} · {hospital.etaMinutes} {t('common.min')}
                </p>
              </div>
              <HospitalMap
                hospitals={[{ ...hospital, rank: 1 }]}
                center={{ lat: hospital.location.lat, lng: hospital.location.lng }}
                selectedId={hospital.id}
                onSelect={() => {}}
                showUser={false}
                zoom={14}
                className="h-[320px] w-full"
              />
            </section>

            <section className="panel p-5">
              <p className="label-xs">{t('results.reception')}</p>
              <p className={`mt-2 inline-flex items-center gap-1.5 text-sm font-bold ${reception.isOpenNow ? 'text-ok' : 'text-danger'}`}>
                <span className={`h-2 w-2 rounded-full ${reception.isOpenNow ? 'bg-ok' : 'bg-danger'}`} />
                {reception.isOpenNow ? t('results.openNow') : t('results.closedNow')}
              </p>
              <p className="mt-1 text-xs text-muted">
                {reception.is24x7 ? t('results.reception24x7') : t('results.receptionHours', { hours: reception.timingLabel || '—' })}
              </p>
              <div className="mt-3 space-y-1.5 text-[11px] text-muted">
                <p>
                  {hospital.is24x7 ? '24×7 · ' : ''}
                  {hospital.ambulanceAvailable ? t('hospital.ambulanceAvailable') : t('hospital.ambulanceUnavailable')}
                </p>
                <p className="italic">{hospital.city}, {hospital.state}</p>
              </div>
              <p className="mt-4 border-t border-line pt-3 text-[10px] leading-relaxed text-muted">{t('disclaimer.short')}</p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
