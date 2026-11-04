import { HeartPulse } from 'lucide-react';

export default function Brand({ compact = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft/70 text-accent ring-1 ring-accent/35">
        <HeartPulse size={20} />
      </span>
      <span className="leading-tight">
        <span className={`block font-black tracking-tight ${compact ? 'text-base' : 'text-lg'}`}>
          <span className="logo-text">RAAHAT</span>
        </span>
        <span className="block text-[9px] font-bold uppercase tracking-[0.28em] text-muted">Control room</span>
      </span>
    </div>
  );
}
