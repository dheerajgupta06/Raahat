import { useNavigate, useLocation } from 'react-router-dom';
import { Ambulance, HeartPulse, PhoneCall, Siren } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { Modal } from './ui/Modal.jsx';

const LINES = [
  {
    number: '112',
    labelKey: 'sos.nationalEmergency',
    detail: 'Police · Fire · Ambulance',
    tone: 'border-brand/40 bg-brand/10 text-brand hover:border-brand/70',
    href: 'tel:112',
  },
  {
    number: '108',
    labelKey: 'sos.ambulanceAlt',
    detail: 'Emergency ambulance',
    tone: 'border-accent/35 bg-accent/10 text-accent hover:border-accent/60',
    href: 'tel:108',
  },
  {
    number: '102',
    labelKey: 'sos.ambulance',
    detail: 'Medical transport',
    tone: 'border-line bg-elevated text-body hover:border-accent/40',
    href: 'tel:102',
  },
];

export function SOSModal() {
  const { t, sosOpen, closeSos } = useApp();
  const navigate = useNavigate();
  const route = useLocation();

  const jumpToFirstAid = () => {
    closeSos();
    if (route.pathname !== '/') {
      navigate('/#first-aid');
      return;
    }
    window.setTimeout(() => {
      document.getElementById('first-aid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  };

  return (
    <Modal
      open={sosOpen}
      onClose={closeSos}
      title={t('sos.title')}
      subtitle={t('sos.subtitle')}
      size="md"
    >
      <div className="space-y-2.5">
        {LINES.map((line) => (
          <a
            key={line.number}
            href={line.href}
            onClick={closeSos}
            className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition active:scale-[0.99] ${line.tone}`}
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-black/15">
              {line.number === '112' ? <Siren size={20} /> : <Ambulance size={20} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold uppercase tracking-wider opacity-80">
                {t(line.labelKey)}
              </span>
              <span className="mt-0.5 block text-sm text-body/85">{line.detail}</span>
            </span>
            <span className="flex items-center gap-2 text-2xl font-black tracking-tight">
              {line.number}
              <PhoneCall size={18} />
            </span>
          </a>
        ))}
      </div>

      <p className="mt-4 flex items-start gap-2 rounded-xl border border-line bg-elevated px-3.5 py-3 text-xs leading-relaxed text-muted">
        <HeartPulse size={15} className="mt-0.5 shrink-0 text-brand" />
        {t('sos.note')}
      </p>

      <button type="button" onClick={jumpToFirstAid} className="btn-outline mt-4 w-full text-xs">
        <HeartPulse size={15} /> {t('sos.firstAid')}
      </button>

      <p className="mt-4 border-t border-line pt-3 text-[11px] leading-relaxed text-muted">
        {t('sos.disclaimer')}
      </p>
    </Modal>
  );
}
