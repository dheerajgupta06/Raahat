import { Link } from 'react-router-dom';
import { Compass, Home, Radar, Siren } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { Header } from '../components/layout/Header.jsx';
import { Footer } from '../components/layout/Footer.jsx';

export function NotFoundPage() {
  const { t, openSos, beginEmergency } = useApp();

  return (
    <div className="flex min-h-screen flex-col bg-tactical">
      <Header />
      <main className="container-page flex flex-1 items-center justify-center py-16">
        <div className="panel-elevated relative w-full max-w-xl overflow-hidden p-8 text-center sm:p-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                'radial-gradient(circle at 50% 0%, rgba(45,226,230,0.14), transparent 60%)',
            }}
          />
          <div className="relative">
            <span className="chip mx-auto border-accent/30 bg-accent/10 text-accent">
              <Radar size={12} />
              {t('notFound.eyebrow')}
            </span>
            <p className="mt-6 font-black tracking-tighter text-accent/20 text-7xl sm:text-8xl">404</p>
            <h1 className="hero-title mt-2 text-3xl font-black text-body sm:text-4xl">
              {t('notFound.title')}
            </h1>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">
              {t('notFound.body')}
            </p>

            <div className="mt-8 flex flex-col justify-center gap-2.5 sm:flex-row">
              <Link to="/" className="btn-accent">
                <Home size={17} />
                {t('notFound.home')}
              </Link>
              <Link to={beginEmergency({})} className="btn-outline">
                <Compass size={17} />
                {t('notFound.results')}
              </Link>
              <button type="button" onClick={openSos} className="btn-primary">
                <Siren size={17} className="animate-pulse" />
                {t('nav.sos')}
              </button>
            </div>

            <p className="mt-6 text-xs font-semibold text-danger">{t('footer.emergency')}</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
