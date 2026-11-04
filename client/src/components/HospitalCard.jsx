import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Ambulance,
  BedDouble,
  ChevronDown,
  ChevronUp,
  Clock3,
  MapPin,
  Navigation,
  Phone,
  Share2,
  ShieldCheck,
  ShieldAlert,
  Siren,
  Stethoscope,
  Wind,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
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
import { CopyButton } from './ui/CopyButton.jsx';

function ratioTone(available, total) {
  if (!total) return TONES.neutral;
  const ratio = available / total;
  if (ratio >= 0.3) return TONES.ok;
  if (ratio >= 0.1) return TONES.warn;
  return TONES.danger;
}

export function HospitalCard({ hospital, selected = false, onSelect }) {
  const { t } = useApp();
  const { search } = useLocation();
  const [expanded, setExpanded] = useState(false);

  const tone = bedTone(hospital.bedStatus);
  const oxygen = oxygenMeta(hospital.oxygenStatus, t);
  const reception = hospital.contacts?.reception || {};
  const emergencyPhone = hospital.contacts?.emergencyWard?.phone || '';
  const closed = reception.isOpenNow === false;
  const primaryPhone = closed && emergencyPhone ? emergencyPhone : reception.phone;
  const primaryIsEmergency = Boolean(closed && emergencyPhone);

  const specialtyBadges = (hospital.specialties || [])
    .filter((specialty) => (hospital.required || []).includes(specialty))
    .slice(0, 3);
  const fallbackBadges = (hospital.specialties || []).slice(0, 3);
  const badges = specialtyBadges.length ? specialtyBadges : fallbackBadges;

  const shareText = t('results.shareMessage', {
    name: hospital.name,
    phone: primaryPhone || '',
    maps: directionsUrl(hospital),
  });

  const contactRows = [
    { key: 'reception', label: t('results.reception'), phone: reception.phone, icon: Phone },
    { key: 'emergency', label: t('results.emergency'), phone: emergencyPhone, icon: Siren },
    { key: 'ambulance', label: t('results.ambulance'), phone: hospital.contacts?.ambulance?.phone, icon: Ambulance },
    { key: 'main', label: t('results.mainLine'), phone: hospital.contacts?.mainLine?.phone, icon: Phone },
  ].filter((row) => row.phone);

  const handleCardClick = (event) => {
    if (event.target.closest('a,button,input,select,textarea')) return;
    onSelect?.(hospital.id);
  };

  const totalAvailable = hospital.availableBeds ?? 0;
  const totalBeds = hospital.totalBeds ?? 0;
  const occupancy = hospital.occupancy ?? 0;

  return (
    <article
      onClick={handleCardClick}
      className={`panel relative overflow-hidden transition duration-200 ${
        selected ? 'border-accent/60 shadow-glow' : 'hover:border-accent/35 hover:bg-elevated/40'
      }`}
      aria-label={hospital.name}
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${tone.bar}`} aria-hidden="true" />

      <div className="p-4 pl-5 sm:p-5 sm:pl-6">
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-xl border font-black ${
              tone.border
            } ${tone.soft} ${tone.text}`}
            aria-hidden="true"
          >
            #{hospital.rank}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`chip min-h-[26px] border px-2 py-0 text-[10px] ${TONES.accent.chip}`}>
                {t(levelLabelKey(hospital.level))}
              </span>
              <span className="chip min-h-[26px] px-2 py-0 text-[10px]">{hospital.type}</span>
              {hospital.isDemo ? (
                <span className="chip min-h-[26px] border-dashed px-2 py-0 text-[10px]">{t('common.demo')}</span>
              ) : null}
              {hospital.isStale ? (
                <span className={`chip min-h-[26px] px-2 py-0 text-[10px] ${TONES.warn.chip}`}>
                  <Clock3 size={10} /> {t('results.stale')}
                </span>
              ) : null}
              {hospital.contacts?.verifiedRecently ? (
                <span className={`chip min-h-[26px] px-2 py-0 text-[10px] ${TONES.ok.chip}`}>
                  <ShieldCheck size={10} /> {t('common.verified')}
                </span>
              ) : null}
            </div>

            <Link
              to={`/hospital/${hospital.id}${search}`}
              className="mt-2 block break-words line-clamp-2 text-base font-bold tracking-tight text-body transition hover:text-accent sm:text-lg"
            >
              {hospital.name}
            </Link>
            <p className="mt-1 flex items-start gap-1 text-[11px] leading-relaxed text-muted sm:text-xs">
              <MapPin size={12} className="mt-0.5 shrink-0" />
              <span className="line-clamp-1">
                {hospital.address}, {hospital.city} · {hospital.pincode}
              </span>
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className={`font-display text-2xl font-black leading-none ${tone.text}`}>
              {formatDistance(hospital.distanceKm)}
              <span className="ml-0.5 text-xs font-semibold text-muted">{t('common.km')}</span>
            </p>
            <p className="mt-1 flex items-center justify-end gap-1 text-[11px] text-muted">
              <Clock3 size={11} /> {hospital.etaMinutes} {t('common.min')}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {badges.map((specialty) => (
            <span key={specialty} className="chip min-h-[26px] px-2 py-0 text-[10px]">
              {t(`specialty.${specialty}`)}
            </span>
          ))}
          {hospital.is24x7 ? (
            <span className={`chip min-h-[26px] px-2 py-0 text-[10px] ${TONES.ok.chip}`}>24×7</span>
          ) : null}
          {hospital.ambulanceAvailable ? (
            <span className="chip min-h-[26px] px-2 py-0 text-[10px]">
              <Ambulance size={10} /> {t('results.ambulance')}
            </span>
          ) : null}
          <span className="chip min-h-[26px] px-2 py-0 text-[10px]">
            {t('results.match', { n: hospital.matchPercent })}
          </span>
        </div>

        <div className="mt-3.5 grid grid-cols-2 gap-2">
          <div className={`rounded-xl border px-2.5 py-2 ${oxygen.classes.border} ${oxygen.classes.soft}`}>
            <p className="label-xs flex items-center gap-1">
              <Wind size={10} /> {t('results.oxygen')}
            </p>
            <p className={`mt-1 text-sm font-bold ${oxygen.classes.text}`}>{oxygen.label}</p>
            <p className="text-[10px] text-muted">{t('results.cylinders', { n: hospital.oxygenCylinders })}</p>
          </div>
          <div className={`rounded-xl border px-2.5 py-2 ${tone.border} ${tone.soft}`}>
            <p className="label-xs flex items-center gap-1">
              <BedDouble size={10} /> {t('results.icuBeds')}
            </p>
            <p className={`mt-1 text-sm font-bold ${tone.text}`}>
              {hospital.beds?.icu?.available ?? 0}
              <span className="ml-1 text-[10px] font-medium text-muted">/ {hospital.beds?.icu?.total ?? 0}</span>
            </p>
            <p className="text-[10px] text-muted">
              {t('results.score')} {hospital.score ?? '—'} · {t('results.bedsAvailable', { n: totalAvailable })}
            </p>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted">
              {t('results.bedsAvailable', { n: totalAvailable })}
              <span className="text-muted"> / {totalBeds}</span>
            </span>
            <span className="text-muted">{t('results.occupancy', { n: occupancy })}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line" role="presentation">
            <div
              className={`h-full rounded-full transition-all duration-500 ${tone.bar}`}
              style={{ width: `${Math.min(100, Math.max(2, 100 - occupancy))}%` }}
            />
          </div>

          <div className="mt-2.5 grid grid-cols-5 gap-1">
            {BED_KEYS.map((key) => {
              const bed = hospital.beds?.[key] || { available: 0, total: 0 };
              const unitTone = ratioTone(bed.available, bed.total);
              return (
                <div key={key} className="rounded-lg border border-line/70 bg-elevated/50 px-1.5 py-1.5">
                  <p className="truncate text-[9px] uppercase tracking-wide text-muted">{t(BED_LABEL_KEYS[key])}</p>
                  <p className={`mt-0.5 text-xs font-bold ${unitTone.text}`}>
                    {bed.available}
                    <span className="text-[9px] font-medium text-muted">/{bed.total}</span>
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px]">
          <span className={`inline-flex items-center gap-1 font-semibold ${reception.isOpenNow ? 'text-ok' : 'text-danger'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${reception.isOpenNow ? 'bg-ok' : 'bg-danger'}`} />
            {reception.isOpenNow ? t('results.openNow') : t('results.closedNow')}
          </span>
          <span className="text-muted">
            {reception.is24x7 ? t('results.reception24x7') : t('results.receptionHours', { hours: reception.timingLabel || '—' })}
          </span>
          <span className="text-muted">· {timeAgo(hospital.lastUpdated, t)}</span>
          <span className="ml-auto inline-flex items-center gap-1 text-muted">
            {hospital.contacts?.verifiedRecently ? (
              <>
                <ShieldCheck size={11} className="text-ok" />
                {t('results.verifiedAt', { time: timeAgo(hospital.contacts.lastVerified, t) })}
              </>
            ) : (
              <>
                <ShieldAlert size={11} /> {t('results.unverified')}
              </>
            )}
          </span>
        </div>

        {hospital.isStale ? (
          <p className={`mt-2 rounded-lg border px-2.5 py-1.5 text-[10px] ${TONES.warn.chip}`}>
            {t('results.staleHint')} — {timeAgo(hospital.lastUpdated, t)}
          </p>
        ) : null}

        {closed && emergencyPhone ? (
          <p className={`mt-2 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold ${TONES.danger.chip}`}>
            {t('results.emergencyPriority')}
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {primaryPhone ? (
            <>
              <a
                href={telHref(primaryPhone)}
                className={`btn min-h-[44px] flex-1 gap-1.5 px-3 text-xs ${
                  primaryIsEmergency ? 'bg-brand text-white shadow-sos hover:bg-brand-500' : 'btn-primary'
                }`}
              >
                {primaryIsEmergency ? <Siren size={15} /> : <Phone size={15} />}
                {primaryIsEmergency ? t('results.callEmergency') : t('results.callReception')}
              </a>
              <CopyButton value={primaryPhone} compact className="border border-line bg-elevated" />
            </>
          ) : null}

          <a
            href={directionsUrl(hospital)}
            target="_blank"
            rel="noreferrer"
            className="btn-outline min-h-[44px] px-3 text-xs"
            aria-label={t('results.directions')}
            title={t('results.directions')}
          >
            <Navigation size={15} />
            <span className="hidden sm:inline">{t('results.directions')}</span>
          </a>

          <a
            href={whatsappShareHref(shareText)}
            target="_blank"
            rel="noreferrer"
            className="icon-btn h-11 w-11 min-h-[44px] min-w-[44px] border-ok/30 text-ok hover:border-ok/60 hover:text-ok"
            aria-label={t('results.shareWhatsapp')}
            title={t('results.shareWhatsapp')}
          >
            <Share2 size={16} />
          </a>

          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="btn-outline min-h-[44px] px-3 text-xs"
            aria-expanded={expanded}
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            <span className="hidden sm:inline">
              {expanded ? t('results.lessDetails') : t('results.moreDetails')}
            </span>
          </button>
        </div>

        {expanded ? (
          <div className="mt-4 space-y-4 border-t border-line pt-4 animate-fade-up">
            <div>
              <p className="label-xs">{t('hospital.contactNumbers')}</p>
              <div className="mt-2 space-y-1.5">
                {contactRows.map((row) => {
                  const Icon = row.icon;
                  return (
                    <div
                      key={row.key}
                      className="flex items-center gap-2 rounded-lg border border-line/70 bg-elevated/50 px-2.5 py-2"
                    >
                      <Icon size={14} className="shrink-0 text-accent" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[10px] uppercase tracking-wide text-muted">{row.label}</p>
                        <p className="text-xs font-semibold text-body">{formatPhone(row.phone)}</p>
                      </div>
                      <CopyButton value={row.phone} compact />
                      <a
                        href={whatsappHref(row.phone)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ok transition hover:bg-ok/10"
                        aria-label={t('results.shareWhatsapp')}
                      >
                        <Share2 size={13} />
                      </a>
                      <a
                        href={telHref(row.phone)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-body transition hover:bg-accent/10 hover:text-accent"
                        aria-label={t('common.call')}
                      >
                        <Phone size={14} />
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="label-xs">{t('results.bedBoard')}</p>
              <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {BED_KEYS.map((key) => {
                  const bed = hospital.beds?.[key] || { available: 0, total: 0 };
                  const unitTone = ratioTone(bed.available, bed.total);
                  const ratio = bed.total ? Math.round((bed.available / bed.total) * 100) : 0;
                  return (
                    <div key={key} className="rounded-lg border border-line/70 px-2.5 py-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted">{t(BED_LABEL_KEYS[key])}</span>
                        <span className={`font-bold ${unitTone.text}`}>
                          {bed.available} <span className="font-medium text-muted">/ {bed.total}</span>
                        </span>
                      </div>
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-line">
                        <div className={`h-full rounded-full ${unitTone.bar}`} style={{ width: `${Math.max(2, ratio)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {(hospital.doctorsOnDuty || []).length ? (
              <div>
                <p className="label-xs flex items-center gap-1">
                  <Stethoscope size={11} /> {t('results.doctors')}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {hospital.doctorsOnDuty.map((doctor) => (
                    <span
                      key={`${doctor.name}-${doctor.specialty}`}
                      className="chip min-h-[28px] px-2 py-0 text-[10px]"
                      title={doctor.specialty}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${doctor.available ? 'bg-ok' : 'bg-muted'}`} />
                      <span className="max-w-[140px] truncate">{doctor.name}</span>
                      <span className="text-muted">· {doctor.specialty}</span>
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <Link
              to={`/hospital/${hospital.id}${search}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
            >
              {t('results.viewHospital')} →
            </Link>
          </div>
        ) : null}
      </div>
    </article>
  );
}
