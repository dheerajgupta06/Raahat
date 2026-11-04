import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

const TONE = {
  ok: { icon: CheckCircle2, classes: 'border-ok/40 bg-ok/10 text-ok' },
  warn: { icon: AlertTriangle, classes: 'border-warn/40 bg-warn/10 text-warn' },
  danger: { icon: AlertTriangle, classes: 'border-danger/40 bg-danger/10 text-danger' },
  info: { icon: Info, classes: 'border-accent/40 bg-accent/10 text-accent' },
};

export function Toaster() {
  const { toasts, dismissToast } = useApp();

  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[120] flex flex-col items-center gap-2 px-4 sm:bottom-6">
      {toasts.map((toast) => {
        const tone = TONE[toast.tone] || TONE.info;
        const Icon = tone.icon;
        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border bg-surface px-3.5 py-3 text-sm shadow-xl ${tone.classes} animate-fade-up`}
          >
            <Icon size={17} className="mt-0.5 shrink-0" />
            <p className="flex-1 text-body">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 text-muted transition hover:text-body"
              aria-label="Dismiss"
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
