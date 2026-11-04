export const TONES = {
  ok: {
    text: 'text-ok',
    soft: 'bg-ok/10',
    border: 'border-ok/30',
    dot: 'bg-ok',
    bar: 'bg-ok',
    chip: 'border-ok/30 bg-ok/10 text-ok',
    glow: 'shadow-[0_0_18px_rgba(52,211,153,0.25)]',
    hex: '#34d399',
  },
  warn: {
    text: 'text-warn',
    soft: 'bg-warn/10',
    border: 'border-warn/30',
    dot: 'bg-warn',
    bar: 'bg-warn',
    chip: 'border-warn/30 bg-warn/10 text-warn',
    glow: 'shadow-[0_0_18px_rgba(251,191,36,0.22)]',
    hex: '#fbbf24',
  },
  danger: {
    text: 'text-danger',
    soft: 'bg-danger/10',
    border: 'border-danger/30',
    dot: 'bg-danger',
    bar: 'bg-danger',
    chip: 'border-danger/30 bg-danger/10 text-danger',
    glow: 'shadow-[0_0_18px_rgba(251,113,133,0.25)]',
    hex: '#fb7185',
  },
  accent: {
    text: 'text-accent',
    soft: 'bg-accent/10',
    border: 'border-accent/30',
    dot: 'bg-accent',
    bar: 'bg-accent',
    chip: 'border-accent/30 bg-accent/10 text-accent',
    glow: 'shadow-glow',
    hex: '#2de2e6',
  },
  neutral: {
    text: 'text-muted',
    soft: 'bg-elevated',
    border: 'border-line',
    dot: 'bg-muted',
    bar: 'bg-muted',
    chip: 'border-line bg-elevated text-muted',
    glow: '',
    hex: '#8b9cb5',
  },
};

export const BED_STATUS_TONE = {
  green: 'ok',
  yellow: 'warn',
  red: 'danger',
};

export const BED_FILTER_UNITS = [
  { key: 'general', labelKey: 'results.general' },
  { key: 'icu', labelKey: 'results.icuBeds' },
  { key: 'oxygen', labelKey: 'results.oxygenBeds' },
  { key: 'ventilator', labelKey: 'results.ventilator' },
  { key: 'emergency', labelKey: 'results.emergencyBeds' },
];

export function bedTone(status) {
  return TONES[BED_STATUS_TONE[status] || 'neutral'];
}

export function oxygenMeta(status, t) {
  const map = {
    available: { tone: 'ok', labelKey: 'results.oxygenHigh' },
    limited: { tone: 'warn', labelKey: 'results.oxygenLimited' },
    unavailable: { tone: 'danger', labelKey: 'results.oxygenNone' },
  };
  const meta = map[status] || map.unavailable;
  return { ...meta, label: t(meta.labelKey), classes: TONES[meta.tone] };
}

export function bedStatusLabelKey(status) {
  if (status === 'green') return 'results.manyBeds';
  if (status === 'yellow') return 'results.fewBeds';
  return 'results.full';
}

export function levelLabelKey(level) {
  if (level?.code === 1) return 'results.level1';
  if (level?.code === 2) return 'results.level2';
  return 'results.level3';
}

export const FILTERS = [
  { id: 'all', labelKey: 'results.filter.all' },
  { id: 'icu', labelKey: 'results.filter.icu' },
  { id: 'trauma', labelKey: 'results.filter.trauma' },
  { id: 'govt', labelKey: 'results.filter.govt' },
  { id: 'oxygen', labelKey: 'results.filter.oxygen' },
  { id: 'emergency', labelKey: 'results.filter.emergency' },
];

export const SORTS = [
  { id: 'best', labelKey: 'results.sort.best' },
  { id: 'nearest', labelKey: 'results.sort.nearest' },
  { id: 'beds', labelKey: 'results.sort.beds' },
  { id: 'oxygen', labelKey: 'results.sort.oxygen' },
];

export const RADII = [10, 25, 50];
