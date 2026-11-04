import { Link } from 'react-router-dom';
import { ArrowLeft, Moon, Radar, ShieldCheck, Siren, Sun, Zap } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { Logo } from '../ui/Logo.jsx';

export function AuthShell({ title, subtitle, icon: Icon, children, footer }) {
  const { t, theme, toggleTheme, lang, toggleLang } = useApp();

  return (
    <div className="auth-shell flex min-h-screen flex-col">
      <header className="border-b border-line/70 bg-bg/60 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between gap-2">
          <Link to="/" aria-label={t('app.name')}>
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-1.5">
            <Link to="/" className="btn-ghost min-h-[40px] px-2.5 text-xs">
              <ArrowLeft size={15} />
              <span className="hidden sm:inline">{t('common.back')}</span>
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              className="icon-btn h-10 min-h-[40px] w-10 min-w-[40px]"
              aria-label={theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button type="button" onClick={toggleLang} className="chip min-h-[40px] px-3 font-bold text-body">
              {lang === 'en' ? 'EN' : 'हिं'}
            </button>
          </div>
        </div>
      </header>

      <main className="container-page grid flex-1 gap-10 py-8 lg:grid-cols-[1fr_minmax(0,580px)] lg:items-center lg:py-12">
        <aside className="hidden lg:block">
          <p className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-ok" />
            {t('nav.regionNode')} · {t('nav.active')}
          </p>
          <h2 className="hero-title mt-6 text-4xl font-black leading-[1.05] text-body xl:text-5xl">
            {t('hero.title1')}
            <span className="logo-text mt-1 block">{t('hero.title2')}</span>
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">{t('hero.subtitle')}</p>

          <div className="mt-7 space-y-2.5">
            {[
              { icon: Radar, title: t('feature.1.title'), body: t('feature.1.body') },
              { icon: Zap, title: t('feature.2.title'), body: t('feature.2.body') },
              { icon: ShieldCheck, title: t('feature.4.title'), body: t('feature.4.body') },
            ].map(({ icon: FeatureIcon, title: featureTitle, body }) => (
              <div key={featureTitle} className="flex items-start gap-3 rounded-xl border border-line/70 bg-surface/50 p-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-accent/25 bg-accent/10 text-accent">
                  <FeatureIcon size={16} />
                </span>
                <div>
                  <p className="text-xs font-bold text-body">{featureTitle}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted">{body}</p>
                </div>
              </div>
            ))}
          </div>

          <a
            href="tel:112"
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-brand/30 bg-brand/10 px-4 py-2.5 text-xs font-bold text-brand transition hover:border-brand/60"
          >
            <Siren size={16} /> 112 · {t('sos.nationalEmergency')}
          </a>
        </aside>

        <div className="w-full">
          <div className="panel overflow-hidden">
            <div className="border-b border-line bg-elevated/30 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                {Icon ? (
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
                    <Icon size={20} />
                  </span>
                ) : null}
                <div>
                  <h1 className="text-xl font-black tracking-tight text-body sm:text-2xl">{title}</h1>
                  {subtitle ? <p className="mt-1 text-sm leading-relaxed text-muted">{subtitle}</p> : null}
                </div>
              </div>
            </div>
            <div className="p-5 sm:p-6">{children}</div>
          </div>
          {footer ? <div className="mt-4 text-center text-xs text-muted">{footer}</div> : null}
          <p className="mt-4 text-center text-[10px] leading-relaxed text-muted">{t('sos.disclaimer')}</p>
        </div>
      </main>
    </div>
  );
}
