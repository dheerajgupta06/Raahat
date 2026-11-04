import { useCallback, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowUpDown,
  Crosshair,
  List,
  Map as MapIcon,
  MapPin,
  Radar,
  RotateCcw,
  SearchX,
  Stethoscope,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useNearbyHospitals } from '../hooks/useNearbyHospitals.js';
import { PROBLEM_BY_ID } from '../lib/problems.js';
import { describeCoordinates } from '../lib/locations.js';
import { FILTERS, RADII, SORTS, TONES, bedStatusLabelKey } from '../lib/status.js';
import { Header } from '../components/layout/Header.jsx';
import { OfflineBanner } from '../components/layout/OfflineBanner.jsx';
import { HospitalCard } from '../components/HospitalCard.jsx';
import { HospitalMap } from '../components/HospitalMap.jsx';

function CardSkeleton() {
  return (
    <div className="panel p-4">
      <div className="flex gap-3">
        <div className="skeleton h-11 w-11 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-4 w-3/4" />
          <div className="skeleton h-3 w-1/2" />
        </div>
        <div className="skeleton h-8 w-12" />
      </div>
      <div className="mt-3 flex gap-1.5">
        <div className="skeleton h-6 w-16 rounded-full" />
        <div className="skeleton h-6 w-20 rounded-full" />
        <div className="skeleton h-6 w-14 rounded-full" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="skeleton h-14 rounded-xl" />
        <div className="skeleton h-14 rounded-xl" />
      </div>
      <div className="mt-3 skeleton h-2 w-full rounded-full" />
      <div className="mt-3 flex gap-2">
        <div className="skeleton h-11 flex-1 rounded-xl" />
        <div className="skeleton h-11 w-11 rounded-xl" />
        <div className="skeleton h-11 w-11 rounded-xl" />
      </div>
    </div>
  );
}

function matchesFilter(hospital, filter) {
  switch (filter) {
    case 'icu':
      return (hospital.beds?.icu?.available || 0) > 0;
    case 'trauma':
      return hospital.specialties?.includes('Trauma') || hospital.level?.code === 1;
    case 'govt':
      return hospital.type === 'Govt';
    case 'oxygen':
      return hospital.oxygenStatus !== 'unavailable';
    case 'emergency':
      return Boolean(hospital.is24x7);
    default:
      return true;
  }
}

export function ResultsPage() {
  const {
    t,
    lang,
    location,
    detectLocation,
    online,
    problemId,
    severity: contextSeverity,
  } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('nearest');
  const [selectedId, setSelectedId] = useState(null);
  const [view, setView] = useState('list');

  const latParam = searchParams.get('lat');
  const lngParam = searchParams.get('lng');
  const latRaw = latParam?.trim() ? Number(latParam) : Number.NaN;
  const lngRaw = lngParam?.trim() ? Number(lngParam) : Number.NaN;
  const lat = Number.isFinite(latRaw) ? latRaw : location.lat;
  const lng = Number.isFinite(lngRaw) ? lngRaw : location.lng;
  const origin = useMemo(() => describeCoordinates(lat, lng), [lat, lng]);

  const radiusRaw = Number(searchParams.get('radius'));
  const radius = RADII.includes(radiusRaw) ? radiusRaw : 25;

  const problemKey = searchParams.get('problem') || problemId || 'other';
  const problem = PROBLEM_BY_ID[problemKey] ? problemKey : 'other';
  const severityRaw = searchParams.get('severity') || contextSeverity || 'critical';
  const severity = ['critical', 'serious', 'moderate'].includes(severityRaw) ? severityRaw : 'critical';
  const note = searchParams.get('note') || '';

  const { data, loading, refreshing, error, cached, savedAt, reload } = useNearbyHospitals({
    lat,
    lng,
    radius,
    problem,
    severity,
    online,
  });

  const updateParam = useCallback(
    (key, value) => {
      const next = new URLSearchParams(searchParams);
      next.set(key, value);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = data.filter((hospital) => {
      if (!matchesFilter(hospital, filter)) return false;
      if (!query) return true;
      const haystack = [
        hospital.name,
        hospital.city,
        hospital.address,
        hospital.type,
        ...(hospital.specialties || []),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });

    const sorters = {
      best: (a, b) => (b.score || 0) - (a.score || 0) || (a.distanceKm || 0) - (b.distanceKm || 0),
      nearest: (a, b) => (a.distanceKm || 0) - (b.distanceKm || 0) || (b.score || 0) - (a.score || 0),
      beds: (a, b) => (b.careAvailable || 0) - (a.careAvailable || 0) || (a.distanceKm || 0) - (b.distanceKm || 0),
      oxygen: (a, b) => (b.oxygenScore || 0) - (a.oxygenScore || 0) || (b.score || 0) - (a.score || 0),
    };

    return [...filtered].sort(sorters[sort] || sorters.best).map((hospital, index) => ({
      ...hospital,
      rank: index + 1,
    }));
  }, [data, filter, search, sort]);

  const problemMeta = PROBLEM_BY_ID[problem];
  const hasFilterOrSearch = Boolean(search.trim()) || filter !== 'all';
  const live = online && !cached && !error;

  const handleSelect = (id) => {
    setSelectedId(id);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setView('map');
      return;
    }
    const node = document.getElementById(`hospital-card-${id}`);
    node?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const resetFilters = () => {
    setFilter('all');
    setSearch('');
  };

  const recalibrate = async () => {
    const next = await detectLocation();
    if (!next) return;
    const params = new URLSearchParams(searchParams);
    params.set('lat', String(next.lat));
    params.set('lng', String(next.lng));
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="min-h-screen bg-tactical">
      <Header
        variant="results"
        search={search}
        onSearch={setSearch}
        locationLabel={origin.label}
        onRecalibrate={recalibrate}
      />

      <main className="container-page py-3 lg:py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`chip min-h-[30px] border-accent/25 bg-accent/10 px-2.5 py-0 text-[10px] ${TONES.accent.text}`}>
            <Stethoscope size={11} />
            {problemMeta.label[lang]}
          </span>
          <button
            type="button"
            onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), severity: severity === 'critical' ? 'serious' : severity === 'serious' ? 'moderate' : 'critical' }, { replace: true })}
            className={`chip min-h-[30px] px-2.5 py-0 text-[10px] ${
              severity === 'critical' ? TONES.danger.chip : severity === 'serious' ? TONES.warn.chip : TONES.ok.chip
            }`}
            title={t(`triage.severity.${severity}Note`)}
          >
            {t(`triage.severity.${severity}`)}
          </button>
          <Link to="/#triage" className="text-[11px] font-semibold text-accent hover:underline">
            {t('triage.kicker')}
          </Link>
          {note ? (
            <span className="chip min-h-[30px] max-w-[260px] gap-1 px-2.5 py-0 text-[10px]" title={note}>
              <span className="truncate">“{note}”</span>
            </span>
          ) : null}

          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <span
              className={`chip min-h-[30px] px-2.5 py-0 text-[10px] ${
                live ? TONES.ok.chip : TONES.warn.chip
              }`}
              title={live ? t('results.liveSync') : t('results.offlineMode')}
            >
              {live ? (
                <>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-ok" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-ok" />
                  </span>
                  {t('results.liveSync')}
                </>
              ) : (
                <>
                  <WifiOff size={11} /> {cached ? t('results.cached') : t('results.offlineMode')}
                </>
              )}
            </span>

            <div className="flex items-center gap-1 rounded-lg border border-line bg-surface p-0.5" role="group" aria-label={t('results.radius')}>
              <span className="hidden px-1.5 text-[9px] uppercase tracking-wider text-muted sm:inline">
                {t('results.radius')}
              </span>
              {RADII.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => updateParam('radius', String(value))}
                  className={`min-h-[28px] rounded-md px-2 text-[10px] font-bold transition ${
                    radius === value ? 'bg-accent text-[#00161a]' : 'text-muted hover:text-body'
                  }`}
                >
                  {value} km
                </button>
              ))}
            </div>

            <div className="flex rounded-lg border border-line bg-surface p-0.5 lg:hidden" role="group">
              <button
                type="button"
                onClick={() => setView('list')}
                className={`inline-flex min-h-[28px] items-center gap-1 rounded-md px-2 text-[10px] font-bold transition ${
                  view === 'list' ? 'bg-accent text-[#00161a]' : 'text-muted'
                }`}
              >
                <List size={12} /> {t('results.list')}
              </button>
              <button
                type="button"
                onClick={() => setView('map')}
                className={`inline-flex min-h-[28px] items-center gap-1 rounded-md px-2 text-[10px] font-bold transition ${
                  view === 'map' ? 'bg-accent text-[#00161a]' : 'text-muted'
                }`}
              >
                <MapIcon size={12} /> {t('results.map')}
              </button>
            </div>
          </div>
        </div>

        {!online ? <OfflineBanner className="mt-3" /> : null}
        {cached && online ? <OfflineBanner className="mt-3" cached savedAt={savedAt} /> : null}
        {refreshing ? (
          <p className="mt-2 flex items-center gap-1.5 text-[10px] text-accent">
            <Radar size={11} className="animate-spin" /> {t('results.searching')}
          </p>
        ) : null}

        <div className="mt-3 grid w-full gap-3 lg:grid-cols-[minmax(380px,440px)_minmax(0,1fr)]">
          <section
            className={`panel flex min-h-0 max-h-[calc(100dvh-230px)] flex-col overflow-hidden lg:h-[calc(100dvh-186px)] lg:max-h-none ${
              view === 'map' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <div className="border-b border-line p-3.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="label-xs flex items-center gap-1 text-accent">
                    <MapPin size={10} /> {origin.label} · {radius} km
                  </p>
                  <h1 className="mt-0.5 text-lg font-black tracking-tight text-body">{t('results.title')}</h1>
                </div>
                <span className="chip min-h-[30px] border-accent/25 bg-accent/10 px-2.5 py-0 text-[10px] text-accent">
                  {t('results.centers', { n: visible.length })}
                </span>
              </div>

              <div className="hide-scrollbar mt-2.5 flex gap-1.5 overflow-x-auto pb-0.5">
                {FILTERS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFilter(item.id)}
                    className={`chip min-h-[28px] shrink-0 px-2.5 py-0 text-[10px] font-semibold transition ${
                      filter === item.id
                        ? 'border-accent/50 bg-accent/10 text-accent'
                        : 'hover:border-accent/30 hover:text-body'
                    }`}
                  >
                    {t(item.labelKey)}
                  </button>
                ))}
              </div>

              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-[10px] text-muted">
                  {t('results.showing', { shown: visible.length, total: data.length })}
                </p>
                <label className="flex items-center gap-1 text-[10px] text-muted">
                  <ArrowUpDown size={11} />
                  <span className="sr-only">{t('results.sort')}</span>
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                    className="field-sm min-h-[32px] w-auto py-0 pr-7 text-[10px] font-semibold"
                  >
                    {SORTS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="thin-scrollbar flex-1 space-y-2.5 overflow-y-auto p-2.5">
              {loading ? (
                <>
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                </>
              ) : error ? (
                <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl border border-danger/30 bg-danger/10 text-danger">
                    <WifiOff size={22} />
                  </span>
                  <p className="text-sm font-bold text-body">{t('results.errorTitle')}</p>
                  <p className="max-w-xs text-xs text-muted">{t('results.errorHint')}</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={reload} className="btn-outline min-h-[44px] px-3 text-xs">
                      <RotateCcw size={14} /> {t('common.retry')}
                    </button>
                    <a href="tel:112" className="btn-primary min-h-[44px] px-3 text-xs">
                      112
                    </a>
                  </div>
                </div>
              ) : visible.length ? (
                visible.map((hospital) => (
                  <div key={hospital.id} id={`hospital-card-${hospital.id}`}>
                    <HospitalCard
                      hospital={hospital}
                      selected={selectedId === hospital.id}
                      onSelect={handleSelect}
                    />
                  </div>
                ))
              ) : data.length ? (
                <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl border border-line bg-elevated text-muted">
                    <SearchX size={22} />
                  </span>
                  <p className="text-sm font-bold text-body">{t('results.noFilterMatch')}</p>
                  <button type="button" onClick={resetFilters} className="btn-outline min-h-[44px] px-3 text-xs">
                    <RotateCcw size={14} /> {t('results.resetFilters')}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl border border-warn/30 bg-warn/10 text-warn">
                    <SearchX size={22} />
                  </span>
                  <p className="text-sm font-bold text-body">{t('results.noResults')}</p>
                  <p className="max-w-xs text-xs text-muted">{t('results.noResultsHint')}</p>
                  {radius < 50 ? (
                    <button
                      type="button"
                      onClick={() => updateParam('radius', '50')}
                      className="btn-accent min-h-[44px] px-4 text-xs"
                    >
                      <Radar size={14} /> {t('results.radius')} 50 km
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          </section>

          <section
            className={`panel relative overflow-hidden lg:h-[calc(100dvh-186px)] ${
              view === 'list' ? 'hidden lg:block' : 'block'
            } h-[68vh]`}
          >
            <HospitalMap
              hospitals={visible}
              center={{ lat, lng }}
              selectedId={selectedId}
              onSelect={handleSelect}
              className="h-full w-full"
            />

            <div className="map-overlay absolute left-3 top-3 z-10 rounded-xl border border-line bg-surface/90 px-2.5 py-2 backdrop-blur">
              <p className="label-xs flex items-center gap-1">
                <MapPin size={10} /> {t('results.mapLegend')}
              </p>
              <div className="mt-1.5 flex items-center gap-2.5 text-[9px] text-muted">
                {[
                  { tone: TONES.ok, key: 'manyBeds' },
                  { tone: TONES.warn, key: 'fewBeds' },
                  { tone: TONES.danger, key: 'full' },
                ].map((item) => (
                  <span key={item.key} className="flex items-center gap-1">
                    <span className={`h-1.5 w-1.5 rounded-full ${item.tone.dot}`} />
                    {t(bedStatusLabelKey(item.key === 'manyBeds' ? 'green' : item.key === 'fewBeds' ? 'yellow' : 'red'))}
                  </span>
                ))}
              </div>
            </div>

            <div className="map-overlay absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-lg border border-line bg-surface/90 px-2.5 py-1.5 text-[9px] text-muted backdrop-blur">
              <Crosshair size={10} className="text-accent" /> {t('results.youAreHere')} · {origin.label}
            </div>

            <div className="map-overlay absolute bottom-3 right-3 z-10 flex items-center gap-1 rounded-lg border border-line bg-surface/90 px-2.5 py-1.5 text-[9px] text-muted backdrop-blur">
              {live ? <Wifi size={10} className="text-ok" /> : <WifiOff size={10} className="text-warn" />}
              {live ? t('results.realtime') : t('results.offlineMode')}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
