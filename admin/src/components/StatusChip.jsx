import { STATUS_META } from '../lib/format.js';

const TONES = {
  ok: 'border-ok/35 bg-ok/10 text-ok',
  warn: 'border-warn/35 bg-warn/10 text-warn',
  danger: 'border-danger/35 bg-danger/10 text-danger',
  muted: 'border-line bg-elevated text-muted',
};

export default function StatusChip({ status = 'pending', label }) {
  const meta = STATUS_META[status] || STATUS_META.pending;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
        TONES[meta.tone] || TONES.muted
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label || meta.label}
    </span>
  );
}
