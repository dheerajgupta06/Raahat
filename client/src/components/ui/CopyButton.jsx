import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

export function CopyButton({ value, label, className = '', compact = false }) {
  const { t, pushToast } = useApp();
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(0);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const copy = useCallback(async () => {
    if (!value) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const input = document.createElement('textarea');
        input.value = value;
        input.setAttribute('readonly', '');
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      pushToast(t('results.copiedNumber'), 'ok', 2000);
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setCopied(false), 1800);
    } catch {
      pushToast(t('results.copyNumber'), 'warn');
    }
  }, [value, pushToast, t]);

  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex items-center justify-center gap-1 transition hover:text-accent ${
        compact ? 'h-8 w-8 rounded-lg' : 'min-h-[40px] rounded-lg border border-line px-2.5 text-xs font-semibold'
      } ${className}`}
      aria-label={t('results.copyNumber')}
      title={t('results.copyNumber')}
    >
      {copied ? <Check size={14} className="text-ok" /> : <Copy size={14} />}
      {compact ? null : <span>{copied ? t('common.copied') : t('common.copy')}</span>}
      {label ? <span className="sr-only">{label}</span> : null}
    </button>
  );
}
