import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Baby,
  Brain,
  Car,
  CheckCircle2,
  ChevronRight,
  Crosshair,
  FlaskConical,
  Flame,
  HeartPulse,
  LocateFixed,
  MapPin,
  Mic,
  MicOff,
  Network,
  Radar,
  Search,
  ShieldCheck,
  Siren,
  Stethoscope,
  Thermometer,
  Wind,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useNetworkStats } from '../hooks/useNetworkStats.js';
import { useSpeech } from '../hooks/useSpeech.js';
import { PROBLEMS, matchProblemFromText } from '../lib/problems.js';
import { LOCALITIES, searchLocalities } from '../lib/locations.js';
import { Header } from '../components/layout/Header.jsx';
import { Footer } from '../components/layout/Footer.jsx';
import { OfflineBanner } from '../components/layout/OfflineBanner.jsx';
import { FirstAidCard } from '../components/FirstAidCard.jsx';
import { FamilyCircle } from '../components/FamilyCircle.jsx';

const PROBLEM_ICONS = {
  heart: HeartPulse,
  breathing: Wind,
  accident: Car,
  stroke: Brain,
  pregnancy: Baby,
  burns: Flame,
  fever: Thermometer,
  poisoning: FlaskConical,
  child: Baby,
  other: Stethoscope,
};

const FEATURES = [
  { icon: Radar, key: '1' },
  { icon: Activity, key: '2' },
  { icon: Network, key: '3' },
  { icon: Zap, key: '4' },
];

const SEVERITIES = [
  { id: 'critical', icon: AlertOctagon, tone: 'border-danger/50 bg-danger/10 text-danger' },
  { id: 'serious', icon: AlertTriangle, tone: 'border-warn/50 bg-warn/10 text-warn' },
  { id: 'moderate', icon: ShieldCheck, tone: 'border-ok/50 bg-ok/10 text-ok' },
];

const QUICK_AREAS = ['Noida Sector 18', 'Connaught Place', 'Gurugram Sector 29', 'Indirapuram', 'Faridabad'];

function formatNumber(value) {
  if (value === null || value === undefined) return '—';
  return Number(value).toLocaleString('en-IN');
}

function RadarVisual({ stats }) {
  const { t } = useApp();

  return (
    <div className="panel-elevated relative overflow-hidden p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2 border-b border-line/70 pb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-ok opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-ok" />
          </span>
          <span className="label-xs text-body">{t('nav.regionNode')}</span>
        </div>
        <span className="chip min-h-[24px] border-ok/30 bg-ok/10 px-2 py-0 text-[9px] text-ok">
          {t('nav.active')}
        </span>
      </div>

      <div className="relative mx-auto mt-5 aspect-square w-full max-w-[330px]">
        <div className="absolute inset-[6%] rounded-full border border-accent/15" />
        <div className="absolute inset-[20%] rounded-full border border-accent/15" />
        <div className="absolute inset-[34%] rounded-full border border-accent/20" />
        <div className="absolute inset-[46%] rounded-full border border-accent/25" />
        <div className="absolute inset-0 animate-radar rounded-full bg-[conic-gradient(from_0deg,rgba(45,226,230,0.28),transparent_28%)]" />
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-accent/10" />
        <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-accent/10" />
        <span className="absolute left-[62%] top-[26%] h-2 w-2 rounded-full bg-ok shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
        <span className="absolute left-[32%] top-[58%] h-2 w-2 rounded-full bg-accent shadow-[0_0_10px_rgba(45,226,230,0.8)]" />
        <span className="absolute left-[72%] top-[66%] h-1.5 w-1.5 rounded-full bg-warn shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
        <span className="absolute left-[44%] top-[36%] h-1.5 w-1.5 rounded-full bg-ok shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
        <div className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl border border-accent/40 bg-surface shadow-glow">
          <HeartPulse size={24} className="text-accent" />
        </div>
      </div>

      <div className="relative -mt-2 grid grid-cols-3 gap-2">
        {[
          { label: t('hero.statVerified'), value: formatNumber(stats?.verifiedCenters) },
          { label: t('hero.statIcu'), value: formatNumber(stats?.icuAvailable) },
          { label: t('hero.statOxygen'), value: formatNumber(stats?.oxygenReady) },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-line/70 bg-surface/60 px-2 py-2 text-center">
            <p className="text-base font-black text-body">{item.value}</p>
            <p className="mt-0.5 text-[8px] uppercase tracking-wider text-muted">{item.label}</p>
          </div>
        ))}
      </div>

      <p className="mt-3 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-accent/80">
        {t('hero.trust')}
      </p>
    </div>
  );
}

export function HomePage() {
  const {
    t,
    lang,
    location,
    geoStatus,
    detectLocation,
    selectLocality,
    problemId,
    setProblemId,
    severity,
    setSeverity,
    beginEmergency,
    online,
    pushToast,
  } = useApp();
  const navigate = useNavigate();
  const { stats, loading: statsLoading, offline: statsOffline } = useNetworkStats();
  const [query, setQuery] = useState('');
  const [searchFocus, setSearchFocus] = useState(false);
  const [note, setNote] = useState('');
  const noteRef = useRef(null);

  const { supported: voiceSupported, listening, start: startVoice, stop: stopVoice } = useSpeech({
    lang,
    onResult: (text) => {
      setNote(text);
      const match = matchProblemFromText(text);
      if (match) {
        setProblemId(match);
        pushToast(`${t('triage.voiceHeard')}: ${text}`, 'ok');
      } else {
        setProblemId('other');
        pushToast(t('triage.voiceNoMatch'), 'warn');
      }
    },
  });

  const suggestions = useMemo(() => {
    if (!searchFocus) return [];
    return searchLocalities(query, 7);
  }, [query, searchFocus]);

  const selectedProblem = problemId ? PROBLEMS.find((problem) => problem.id === problemId) : null;
  const locating = geoStatus === 'locating';

  const locationMessage = {
    locating: t('triage.locating'),
    ready: t('triage.locationReady'),
    manual: t('triage.locationManual'),
    denied: t('triage.permissionDenied'),
    unavailable: t('triage.locationUnavailable'),
    idle: t('triage.locationDefault'),
  }[geoStatus] || t('triage.locationDefault');

  const locate = async () => {
    await detectLocation();
    setSearchFocus(false);
  };

  const chooseArea = (locality) => {
    selectLocality(locality);
    setQuery(locality.name);
    setSearchFocus(false);
  };

  const scrollToTriage = () => {
    document.getElementById('triage')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => noteRef.current?.focus({ preventScroll: true }), 500);
  };

  const handleHeroCta = () => {
    if (!problemId) {
      scrollToTriage();
      return;
    }
    const target = beginEmergency({ problem: problemId, severity });
    navigate(note ? `${target}&note=${encodeURIComponent(note)}` : target);
  };

  const startSearch = () => {
    if (!problemId) {
      scrollToTriage();
      return;
    }
    const target = beginEmergency({ problem: problemId, severity });
    navigate(note ? `${target}&note=${encodeURIComponent(note)}` : target);
  };

  return (
    <div className="min-h-screen bg-tactical">
      <Header />

      <div className="sos-strip border-b border-line/70">
        <div className="container-page flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2.5 text-xs">
          <span className="flex items-center gap-1.5 font-bold uppercase tracking-[0.2em] text-brand">
            <Siren size={14} /> {t('hero.stripLabel')}
          </span>
          <a href="tel:112" className="inline-flex items-center gap-1 font-bold text-body transition hover:text-brand">
            112 <span className="font-medium text-muted">· {t('sos.nationalEmergency')}</span>
          </a>
          <span className="text-line">|</span>
          <a href="tel:108" className="font-semibold text-muted transition hover:text-body">
            108 · {t('sos.ambulanceAlt')}
          </a>
          <span className="text-line">|</span>
          <a href="tel:102" className="font-semibold text-muted transition hover:text-body">
            102 · {t('sos.ambulance')}
          </a>
          <span className="ml-auto hidden text-[10px] uppercase tracking-wider text-muted sm:inline">
            {t('hero.demoNetwork')}
          </span>
        </div>
      </div>

      {!online || statsOffline ? <div className="container-page pt-4"><OfflineBanner /></div> : null}

      <main>
        <section className="relative overflow-hidden">
          <div className="container-page grid gap-10 pb-10 pt-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14 lg:pb-14 lg:pt-16">
            <div className="animate-fade-up">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-ok" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-ok" />
                  </span>
                  {t('nav.regionNode')} · {t('nav.active')}
                </span>
                <span className="chip min-h-[28px] border-dashed px-2.5 py-0 text-[10px]">
                  {t('hero.demoNetwork')}
                </span>
              </div>

              <p className="mt-7 text-xs font-bold uppercase tracking-[0.32em] text-accent">
                {t('hero.eyebrow')}
              </p>
              <h1 className="hero-title mt-3 text-[2.7rem] font-black text-body sm:text-6xl xl:text-[4.6rem]">
                <span className="logo-text block text-glow">{t('hero.title1')}</span>
                <span className="mt-1 block">{t('hero.title2')}</span>
              </h1>
              <p className="mt-5 max-w-[36rem] text-base leading-relaxed text-muted sm:text-lg">
                {t('hero.subtitle')}
              </p>

              <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={handleHeroCta}
                  className="btn cta-radar min-h-[58px] px-6 text-sm sm:text-base"
                >
                  <Crosshair size={20} />
                  {t('hero.cta')}
                  <ArrowRight size={18} />
                </button>
                <button type="button" onClick={scrollToTriage} className="btn-outline min-h-[58px] px-5 text-xs">
                  <Stethoscope size={16} />
                  {t('triage.title')}
                  <ChevronRight size={16} />
                </button>
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
                <ShieldCheck size={12} className="text-ok" />
                {t('hero.noSignup')}
              </p>

              <div className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {[
                  { label: t('hero.statGeo'), value: t('hero.statGeoValue'), tone: 'text-accent' },
                  { label: t('hero.statVerified'), value: statsLoading ? '…' : formatNumber(stats?.verifiedCenters), tone: 'text-body' },
                  { label: t('hero.statBeds'), value: statsLoading ? '…' : formatNumber(stats?.availableBeds), tone: 'text-ok' },
                  { label: t('hero.statIcu'), value: statsLoading ? '…' : formatNumber(stats?.icuAvailable), tone: 'text-body' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-line/80 bg-surface/60 px-3 py-3 backdrop-blur">
                    <p className={`font-display text-2xl font-black tracking-tight ${stat.tone}`}>{stat.value}</p>
                    <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden lg:block">
              <RadarVisual stats={stats} />
            </div>
          </div>

          <div className="container-page pb-12 lg:pb-16">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {FEATURES.map(({ icon: Icon, key }) => (
                <div
                  key={key}
                  className="panel group relative overflow-hidden p-4 transition hover:border-accent/40 hover:bg-elevated/50"
                >
                  <span className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-accent/5 blur-xl transition group-hover:bg-accent/10" />
                  <span className="grid h-10 w-10 place-items-center rounded-xl border border-accent/25 bg-accent/10 text-accent">
                    <Icon size={18} />
                  </span>
                  <p className="mt-3 text-sm font-bold text-body">{t(`feature.${key}.title`)}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted">{t(`feature.${key}.body`)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="triage" className="border-y border-line/70 bg-surface/25 py-12 lg:py-16">
          <div className="container-page">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="label-xs text-accent">{t('triage.kicker')}</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-body sm:text-4xl">{t('triage.title')}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{t('triage.subtitle')}</p>
              </div>
              <span className="chip hidden border-dashed px-3 py-1.5 text-[10px] sm:inline-flex">
                <MapPin size={12} /> {location.city || location.label}
              </span>
            </div>

            <div className="mt-7 grid gap-5 xl:grid-cols-[1.45fr_0.55fr]">
              <div className="space-y-5">
                <div className="panel p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="label-xs">{t('triage.step1')}</p>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
                        geoStatus === 'denied' || geoStatus === 'unavailable' ? 'text-warn' : 'text-ok'
                      }`}
                    >
                      {locating ? <LocateFixed size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                      {locationMessage}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-line bg-elevated/50 px-3 py-2.5">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-accent/25 bg-accent/10 text-accent">
                        <MapPin size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-body">
                          {location.label}
                          {location.city ? <span className="font-medium text-muted"> · {location.city}</span> : null}
                        </p>
                        <p className="truncate text-[10px] text-muted">
                          {t('triage.coords')} {Number(location.lat).toFixed(4)}, {Number(location.lng).toFixed(4)} ·{' '}
                          {location.source === 'gps' ? 'GPS' : location.source === 'manual' ? t('triage.locationManual') : 'DEMO'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={locate}
                        disabled={locating}
                        className="icon-btn h-9 w-9 min-h-[36px] min-w-[36px] shrink-0"
                        title={t('triage.useMyLocation')}
                        aria-label={t('triage.useMyLocation')}
                      >
                        <Crosshair size={15} className={locating ? 'animate-spin' : ''} />
                      </button>
                    </div>

                    <div className="relative w-full md:w-72">
                      <label className="relative block">
                        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                          value={query}
                          onChange={(event) => {
                            setQuery(event.target.value);
                            setSearchFocus(true);
                          }}
                          onFocus={() => setSearchFocus(true)}
                          onBlur={() => window.setTimeout(() => setSearchFocus(false), 160)}
                          placeholder={t('triage.searchPlaceholder')}
                          className="field-sm min-h-[44px] pl-9"
                          aria-label={t('triage.searchPlaceholder')}
                        />
                      </label>
                      {suggestions.length ? (
                        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 max-h-64 overflow-y-auto rounded-xl border border-line bg-surface p-1 shadow-2xl thin-scrollbar">
                          {suggestions.map((locality) => (
                            <button
                              key={`${locality.name}-${locality.lat}`}
                              type="button"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => chooseArea(locality)}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-body transition hover:bg-elevated"
                            >
                              <MapPin size={12} className="shrink-0 text-accent" />
                              <span className="min-w-0 flex-1 truncate">{locality.name}</span>
                              <span className="shrink-0 text-[10px] text-muted">{locality.city}</span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-muted">{t('triage.quickAreas')}:</span>
                    {QUICK_AREAS.map((name) => {
                      const locality = LOCALITIES.find((item) => item.name === name);
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => locality && chooseArea(locality)}
                          className="chip min-h-[26px] px-2 py-0 text-[10px] transition hover:border-accent/40 hover:text-accent"
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="panel p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="label-xs">{t('triage.step2')}</p>
                    <button
                      type="button"
                      onClick={() => (listening ? stopVoice() : startVoice())}
                      disabled={!voiceSupported}
                      className={`chip min-h-[32px] px-2.5 py-1 text-[10px] transition ${
                        listening
                          ? 'border-brand/50 bg-brand/10 text-brand'
                          : 'hover:border-accent/40 hover:text-accent'
                      } disabled:opacity-50`}
                      title={voiceSupported ? t('triage.voice') : t('triage.voiceUnsupported')}
                    >
                      {listening ? <MicOff size={12} className="animate-pulse" /> : <Mic size={12} />}
                      {listening ? t('triage.listening') : t('triage.voice')}
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                    {PROBLEMS.map((problem) => {
                      const Icon = PROBLEM_ICONS[problem.icon] || Stethoscope;
                      const active = problemId === problem.id;
                      return (
                        <button
                          key={problem.id}
                          type="button"
                          onClick={() => setProblemId(problem.id)}
                          aria-pressed={active}
                          className={`group flex min-h-[96px] flex-col items-start gap-1.5 rounded-xl border px-2.5 py-2.5 text-left transition active:scale-[0.99] ${
                            active
                              ? 'border-accent/60 bg-accent/10 shadow-glow'
                              : 'border-line bg-elevated/40 hover:border-accent/35 hover:bg-elevated'
                          }`}
                        >
                          <span
                            className={`grid h-8 w-8 place-items-center rounded-lg border ${
                              active ? 'border-accent/40 bg-accent/15 text-accent' : 'border-line bg-surface text-muted group-hover:text-accent'
                            }`}
                          >
                            <Icon size={16} />
                          </span>
                          <span className={`text-[12px] font-semibold leading-tight ${active ? 'text-body' : 'text-body/90'}`}>
                            {problem.label[lang]}
                          </span>
                          <span className="text-[9px] leading-tight text-muted">{problem.brief[lang]}</span>
                        </button>
                      );
                    })}
                  </div>

                  {problemId === 'other' || note ? (
                    <div className="mt-3">
                      <textarea
                        ref={noteRef}
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        rows={2}
                        maxLength={240}
                        placeholder={t('triage.otherPlaceholder')}
                        className="field min-h-[72px] resize-none text-sm"
                        aria-label={t('triage.otherPlaceholder')}
                      />
                    </div>
                  ) : null}

                  <div className="mt-5 border-t border-line pt-4">
                    <p className="label-xs">{t('triage.step3')}</p>
                    <div className="mt-2.5 grid grid-cols-3 gap-2">
                      {SEVERITIES.map(({ id, icon: Icon, tone }) => {
                        const active = severity === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setSeverity(id)}
                            aria-pressed={active}
                            className={`flex min-h-[52px] items-center justify-center gap-1.5 rounded-xl border px-2 text-xs font-bold transition ${
                              active ? tone : 'border-line bg-elevated/40 text-muted hover:text-body'
                            }`}
                          >
                            <Icon size={15} />
                            {t(`triage.severity.${id}`)}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-[11px] leading-relaxed text-muted">
                      {t(`triage.severity.${severity}Note`)}
                    </p>
                  </div>

                  <div className="mt-5 flex flex-col gap-2.5 border-t border-line pt-4 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={startSearch}
                      disabled={!problemId}
                      className="btn cta-radar min-h-[56px] flex-1 px-5 text-sm disabled:opacity-50 disabled:shadow-none"
                    >
                      <Radar size={18} />
                      {t('triage.cta')}
                      <ArrowRight size={17} />
                    </button>
                    <div className="sm:max-w-[200px]">
                      <p className="flex items-center gap-1 text-[10px] text-muted">
                        <ShieldCheck size={11} className="text-ok" /> {t('triage.ctaHint')}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-[10px] text-muted">
                        <MapPin size={11} /> {t('triage.radiusNote')}
                      </p>
                    </div>
                  </div>
                  {!problemId ? (
                    <p className="mt-2 text-[11px] font-semibold text-warn">{t('triage.chooseHint')}</p>
                  ) : selectedProblem ? (
                    <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted">
                      <CheckCircle2 size={12} className="text-ok" />
                      {selectedProblem.label[lang]} · {t('triage.needs')}: {selectedProblem.brief[lang]}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-5">
                <FirstAidCard problemId={problemId} />

                <div className="panel border-dashed p-4">
                  <p className="label-xs flex items-center gap-1.5">
                    <ShieldCheck size={11} className="text-accent" /> {t('app.tagline')}
                  </p>
                  <p className="mt-2 text-[11px] leading-relaxed text-muted">{t('triage.demoNotice')}</p>
                  <p className="mt-2 text-[11px] leading-relaxed text-muted">{t('triage.autoNote')}</p>
                  <p className="mt-3 rounded-lg border border-warn/30 bg-warn/10 px-2.5 py-2 text-[10px] leading-relaxed text-warn">
                    {t('disclaimer.short')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 lg:py-16">
          <div className="container-page">
            <FamilyCircle />
          </div>
        </section>

        <section className="border-t border-line/70 py-10">
          <div className="container-page grid gap-3 sm:grid-cols-3">
            {[
              { icon: Radar, title: t('feature.1.title'), body: t('feature.1.body') },
              { icon: Activity, title: t('feature.2.title'), body: t('feature.2.body') },
              { icon: Network, title: t('feature.3.title'), body: t('feature.3.body') },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex items-start gap-3 rounded-xl border border-line/70 bg-surface/40 p-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-elevated text-accent">
                  <Icon size={16} />
                </span>
                <div>
                  <p className="text-xs font-bold text-body">{title}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
