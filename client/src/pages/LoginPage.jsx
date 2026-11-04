import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, Loader2, LogIn, Mail, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { DEMO_CREDENTIALS } from '../lib/constants.js';
import { AuthShell } from '../components/auth/AuthShell.jsx';

export function LoginPage() {
  const { t, auth, login, pushToast } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (auth) return <Navigate to="/dashboard" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email.trim(), password);
      pushToast(t('auth.success'), 'ok');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err?.message || t('auth.loginError'));
    } finally {
      setBusy(false);
    }
  };

  const fillDemo = () => {
    setEmail(DEMO_CREDENTIALS.email);
    setPassword(DEMO_CREDENTIALS.password);
    setError('');
  };

  return (
    <AuthShell
      icon={LogIn}
      title={t('auth.loginTitle')}
      subtitle={t('auth.loginSubtitle')}
      footer={
        <p>
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="link font-semibold">
            {t('auth.registerCta')}
          </Link>
        </p>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <label className="block">
          <span className="label-xs">{t('auth.email')}</span>
          <span className="relative mt-1.5 block">
            <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="field pl-9"
              placeholder="hospital@example.in"
              autoComplete="email"
              required
            />
          </span>
        </label>

        <label className="block">
          <span className="label-xs">{t('auth.password')}</span>
          <span className="relative mt-1.5 block">
            <KeyRound size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="field pl-9 pr-11"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((show) => !show)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted transition hover:text-body"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </span>
        </label>

        {error ? (
          <p className="rounded-xl border border-danger/35 bg-danger/10 px-3 py-2.5 text-xs font-medium text-danger">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={busy} className="btn-primary w-full text-sm">
          {busy ? <Loader2 size={17} className="animate-spin" /> : <LogIn size={17} />}
          {busy ? t('auth.signingIn') : t('auth.signIn')}
        </button>
      </form>

      <div className="mt-5 rounded-xl border border-dashed border-line bg-elevated/40 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-xs font-bold text-body">
            <ShieldCheck size={14} className="text-accent" /> {t('auth.demoTitle')}
          </p>
          <button type="button" onClick={fillDemo} className="chip min-h-[28px] px-2.5 py-0 text-[10px] hover:border-accent/40 hover:text-accent">
            {t('auth.fillDemo')}
          </button>
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-muted">{t('auth.demoBody')}</p>
        <div className="mt-2.5 grid gap-1 rounded-lg border border-line bg-surface px-2.5 py-2 font-mono text-[11px] text-muted">
          <p className="flex items-center justify-between gap-2">
            <span className="text-[9px] uppercase tracking-wider">Email</span>
            <span className="text-body">{DEMO_CREDENTIALS.email}</span>
          </p>
          <p className="flex items-center justify-between gap-2">
            <span className="text-[9px] uppercase tracking-wider">Password</span>
            <span className="text-body">{DEMO_CREDENTIALS.password}</span>
          </p>
        </div>
      </div>

      <p className="mt-4 flex items-start gap-1.5 text-[10px] leading-relaxed text-muted">
        <ShieldCheck size={12} className="mt-0.5 shrink-0 text-ok" />
        {t('auth.publicNote')}
      </p>
    </AuthShell>
  );
}
