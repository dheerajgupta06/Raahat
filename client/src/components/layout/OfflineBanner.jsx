import { CloudOff, WifiOff } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

export function OfflineBanner({ cached = false, savedAt, className = '' }) {
  const { t } = useApp();
  const message = cached ? t('results.cached') : t('results.offlineMode');
  const detail = cached && savedAt ? t('results.cachedAt', { time: new Date(savedAt).toLocaleTimeString() }) : null;

  return (
    <div
      className={`flex items-start gap-2.5 rounded-xl border border-warn/35 bg-warn/10 px-3.5 py-2.5 text-xs text-warn ${className}`}
      role="status"
    >
      {cached ? <CloudOff size={15} className="mt-0.5 shrink-0" /> : <WifiOff size={15} className="mt-0.5 shrink-0" />}
      <p className="leading-relaxed">
        <span className="font-semibold">{message}</span>
        {detail ? <span className="ml-1 text-warn/85">· {detail}</span> : null}
        <span className="ml-1 hidden text-warn/80 sm:inline">· {t('footer.emergency')}</span>
      </p>
    </div>
  );
}
