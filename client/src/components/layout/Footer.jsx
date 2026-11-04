import { Link } from 'react-router-dom';
import { HeartPulse, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { Logo } from '../ui/Logo.jsx';

export function Footer() {
  const { t } = useApp();

  return (
    <footer className="mt-16 border-t border-line bg-surface/60">
      <div className="container-page py-10">
        <div className="grid gap-8 md:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <Logo size="sm" />
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">{t('hero.subtitle')}</p>
            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted">
              <ShieldCheck size={15} className="mt-0.5 shrink-0 text-accent" />
              {t('footer.privacyNote')}
            </p>
            <p className="mt-2 flex items-start gap-2 text-xs leading-relaxed text-muted">
              <HeartPulse size={15} className="mt-0.5 shrink-0 text-brand" />
              {t('footer.demo')}
            </p>
          </div>

          <div>
            <p className="label-xs">{t('footer.emergency')}</p>
            <div className="mt-3 space-y-2">
              <a href="tel:112" className="flex items-center gap-2 rounded-lg border border-brand/25 bg-brand/5 px-3 py-2 text-sm font-semibold text-body transition hover:border-brand/50">
                <Phone size={15} className="text-brand" /> 112 · {t('sos.nationalEmergency')}
              </a>
              <a href="tel:108" className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-muted transition hover:text-body">
                <Phone size={15} className="text-accent" /> 108 · {t('sos.ambulanceAlt')}
              </a>
              <a href="tel:102" className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-muted transition hover:text-body">
                <Phone size={15} className="text-accent" /> 102 · {t('sos.ambulance')}
              </a>
            </div>
          </div>

          <div>
            <p className="label-xs">{t('nav.regionNode')}</p>
            <p className="mt-3 flex items-center gap-1.5 text-sm text-muted">
              <MapPin size={14} className="text-accent" /> Delhi NCR · India
            </p>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
              <Link to="/login" className="transition hover:text-accent">{t('nav.login')}</Link>
              <Link to="/register" className="transition hover:text-accent">{t('nav.register')}</Link>
              <Link to="/" className="transition hover:text-accent">{t('nav.home')}</Link>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted">{t('footer.data')}</p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-warn/25 bg-warn/5 px-4 py-3 text-xs leading-relaxed text-muted">
          <strong className="font-semibold text-warn">{t('app.name')}:</strong> {t('footer.disclaimer')}
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-line pt-5 text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Raahat · {t('footer.built')}</p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{t('footer.maps')}</span>
            <span className="hidden sm:inline">·</span>
            <span>{t('footer.local')}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
