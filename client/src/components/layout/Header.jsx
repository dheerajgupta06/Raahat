import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Crosshair,
  Home,
  LogIn,
  MapPin,
  Menu,
  Moon,
  PlusCircle,
  Search,
  ShieldCheck,
  Siren,
  Sun,
  Type,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { Logo } from '../ui/Logo.jsx';

export function Header({ variant = 'home', search = '', onSearch, locationLabel, onRecalibrate }) {
  const {
    t,
    lang,
    toggleLang,
    theme,
    toggleTheme,
    largeText,
    toggleLargeText,
    location,
    geoStatus,
    detectLocation,
    openSos,
    auth,
  } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const route = useLocation();
  const isResults = variant === 'results';

  useEffect(() => {
    setMenuOpen(false);
  }, [route.pathname]);

  const locating = geoStatus === 'locating';
  const activeLabel = locationLabel || location.label;
  const recalibrate = onRecalibrate || (() => detectLocation());

  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-bg/85 backdrop-blur-xl">
      <div className="container-page">
        <div className="flex h-16 items-center gap-2.5 sm:h-[72px] sm:gap-4">
          <Link to="/" className="flex shrink-0 items-center" aria-label={t('app.name')}>
            <Logo size="md" />
          </Link>

          {isResults ? (
            <>
              <span className="chip hidden shrink-0 border-accent/25 bg-accent/10 text-accent xl:inline-flex">
                <MapPin size={12} />
                {t('nav.geoGrid')} · {activeLabel}
              </span>
              <label className="relative hidden min-w-0 flex-1 md:block md:max-w-md">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  value={search}
                  onChange={(event) => onSearch?.(event.target.value)}
                  placeholder={t('results.searchPlaceholder')}
                  className="field-sm min-h-[42px] pl-9 pr-8"
                  aria-label={t('common.search')}
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => onSearch?.('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-body"
                    aria-label={t('common.clear')}
                  >
                    <X size={14} />
                  </button>
                ) : null}
              </label>
            </>
          ) : null}

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <div className="hidden items-center gap-1.5 md:flex">
              {isResults ? (
                <>
                  <Link to="/" className="btn-ghost min-h-[42px] px-3 text-xs" title={t('nav.home')}>
                    <Home size={15} />
                    <span className="hidden lg:inline">{t('nav.home')}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={recalibrate}
                    disabled={locating}
                    className="btn-ghost min-h-[42px] px-3 text-xs"
                    title={t('nav.recalibrate')}
                  >
                    <Crosshair size={15} className={locating ? 'animate-spin' : ''} />
                    <span className="hidden xl:inline">{t('nav.recalibrate')}</span>
                  </button>
                </>
              ) : null}
              <button
                type="button"
                onClick={toggleLargeText}
                className={`icon-btn h-10 min-h-[40px] w-10 min-w-[40px] ${
                  largeText ? 'border-accent/50 text-accent' : ''
                }`}
                aria-label={t('common.largeText')}
                aria-pressed={largeText}
                title={t('common.largeText')}
              >
                <Type size={17} />
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                className="icon-btn h-10 min-h-[40px] w-10 min-w-[40px]"
                aria-label={theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
                title={theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
              >
                {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
              </button>
              <button
                type="button"
                onClick={toggleLang}
                className="chip min-h-[40px] px-3 font-bold text-body"
                aria-label={t('common.language')}
                title={t('common.language')}
              >
                {lang === 'en' ? 'EN' : 'हिं'}
              </button>

              {auth ? (
                <Link to="/dashboard" className="btn-outline min-h-[42px] px-3 text-xs">
                  <ShieldCheck size={15} />
                  <span className="hidden xl:inline">{t('nav.dashboard')}</span>
                </Link>
              ) : (
                <div className="hidden items-center gap-1.5 lg:flex">
                  <Link to="/login" className="btn-ghost min-h-[42px] px-3 text-xs">
                    <LogIn size={15} />
                    {t('nav.login')}
                  </Link>
                  <Link to="/register" className="btn-accent min-h-[42px] px-3 text-xs">
                    <PlusCircle size={15} />
                    {t('nav.register')}
                  </Link>
                </div>
              )}

            </div>

            <button
              type="button"
              onClick={openSos}
              className="btn min-h-[42px] gap-1.5 rounded-xl bg-brand px-3 text-xs text-white shadow-sos hover:bg-brand-500 sm:px-4"
            >
              <Siren size={16} className="animate-pulse" />
              {isResults ? <span className="hidden sm:inline">{t('nav.sosProtocols')}</span> : t('nav.sos')}
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="icon-btn h-10 min-h-[40px] w-10 min-w-[40px] lg:hidden"
              aria-label={t('nav.menu')}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {isResults ? (
          <div className="pb-3 md:hidden">
            <label className="relative block">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={search}
                onChange={(event) => onSearch?.(event.target.value)}
                placeholder={t('results.searchPlaceholder')}
                className="field-sm min-h-[42px] pl-9 pr-8"
                aria-label={t('common.search')}
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => onSearch?.('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-body"
                  aria-label={t('common.clear')}
                >
                  <X size={14} />
                </button>
              ) : null}
            </label>
          </div>
        ) : null}

        {menuOpen ? (
          <div className="mb-4 rounded-2xl border border-line bg-surface p-2 shadow-2xl lg:hidden">
            <div className="grid grid-cols-2 gap-1.5">
              <Link to="/" className="btn-outline min-h-[46px] text-xs">
                <Home size={15} /> {t('nav.home')}
              </Link>
              {auth ? (
                <Link to="/dashboard" className="btn-outline min-h-[46px] text-xs">
                  <ShieldCheck size={15} /> {t('nav.dashboard')}
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn-outline min-h-[46px] text-xs">
                    <LogIn size={15} /> {t('nav.login')}
                  </Link>
                  <Link to="/register" className="btn-accent col-span-2 min-h-[46px] text-xs">
                    <PlusCircle size={15} /> {t('nav.register')}
                  </Link>
                </>
              )}
              {isResults ? (
                <button
                  type="button"
                  onClick={recalibrate}
                  className="btn-outline col-span-2 min-h-[46px] text-xs"
                >
                  <Crosshair size={15} /> {t('nav.recalibrate')}
                </button>
              ) : null}
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1.5 border-t border-line pt-2">
              <button type="button" onClick={toggleLang} className="btn-ghost min-h-[44px] text-xs">
                {lang === 'en' ? 'हिंदी' : 'English'}
              </button>
              <button type="button" onClick={toggleTheme} className="btn-ghost min-h-[44px] text-xs">
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                {theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
              </button>
              <button
                type="button"
                onClick={toggleLargeText}
                className={`btn-ghost min-h-[44px] text-xs ${largeText ? 'text-accent' : ''}`}
              >
                <Type size={15} /> A+
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
