import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useAdmin } from '../context/AdminContext.jsx';

const TONES = {
  ok: { icon: CheckCircle2, className: 'border-ok/35 bg-ok/10 text-ok' },
  warn: { icon: AlertTriangle, className: 'border-warn/35 bg-warn/10 text-warn' },
  danger: { icon: XCircle, className: 'border-danger/35 bg-danger/10 text-danger' },
  info: { icon: Info, className: 'border-line bg-elevated text-body' },
};

export default function ToastStack() {
  const { toasts, dismissToast } = useAdmin();
  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-24 z-[60] flex flex-col gap-2 lg:inset-x-auto lg:bottom-6 lg:right-6 lg:w-[360px]">
      {toasts.map((toast) => {
        const tone = TONES[toast.tone] || TONES.info;
        const Icon = tone.icon;
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-3 shadow-panel backdrop-blur ${tone.className}`}
          >
            <Icon size={18} className="mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-body">{toast.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 rounded-md p-1 text-muted transition hover:bg-surface hover:text-body"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
