import { ArrowRight, ExternalLink, KeyRound, Loader2, Mail, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Brand from '../components/Brand.jsx';
import { useAdmin } from '../context/AdminContext.jsx';
import { PUBLIC_SITE_URL } from '../lib/config.js';

const DEMO = { email: 'control@raahat.demo', password: 'Raahat@123' };

export default function LoginPage() {
  const { token, booting, login } = useAdmin();
  const navigate = useNavigate();
  const [email, setEmail] = useState(DEMO.email);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!booting && token) return <Navigate to="/" replace />;

  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      await login(email.trim().toLowerCase(), password);
      navigate('/', { replace: true });
    } catch (loginError) {
      setError(loginError.message || 'Could not sign in');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-console px-4 py-8 sm:px-6 lg:grid lg:place-items-center">
      <div className="mx-auto grid w-full max-w-4xl gap-6 lg:grid-cols-[1.05fr_1fr]">
        <section className="hidden flex-col justify-between rounded-3xl border border-line bg-surface/70 p-8 backdrop-blur lg:flex">
          <Brand />
          <div className="py-10">
            <p className="label-xs">Hospital network operations</p>
            <h1 className="mt-3 text-4xl font-black leading-[1.05] tracking-tight text-body">
              Verify hospitals.
              <br />
              <span className="text-accent">Approve in seconds.</span>
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              Every registration lands here with its certificate. Review the proof, approve the
              hospital and watch live beds, oxygen and contact verification across the network.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-muted">
              <li className="flex items-center gap-2.5">
                <ShieldCheck size={16} className="text-ok" /> Real-time approval queue with document preview
              </li>
              <li className="flex items-center gap-2.5">
                <KeyRound size={16} className="text-accent" /> Private control-room sign-in
              </li>
              <li className="flex items-center gap-2.5">
                <ArrowRight size={16} className="text-warn" /> Live alerts pushed to this device
              </li>
            </ul>
          </div>

          {PUBLIC_SITE_URL && (
            <a
              href={PUBLIC_SITE_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition hover:text-accent"
            >
              <ExternalLink size={13} /> Open public website
            </a>
          )}
        </section>

        <section className="panel p-6 shadow-panel sm:p-8">
          <div className="lg:hidden">
            <Brand />
          </div>

          <div className="mt-6 lg:mt-0">
            <p className="label-xs">Restricted access</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-body">Control-room sign in</h2>
            <p className="mt-1 text-sm text-muted">Use your network administrator account.</p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={submit}>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-muted">Work email</span>
              <span className="relative block">
                <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="field pl-10"
                  placeholder="you@raahat.demo"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-muted">Password</span>
              <span className="relative block">
                <KeyRound size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="field pl-10"
                  placeholder="••••••••"
                />
              </span>
            </label>

            {error && (
              <p className="rounded-xl border border-danger/35 bg-danger/10 px-3 py-2 text-xs font-semibold text-danger">
                {error}
              </p>
            )}

            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? <Loader2 size={17} className="animate-spin" /> : <ArrowRight size={17} />}
              {busy ? 'Signing in…' : 'Enter control room'}
            </button>
          </form>

          <div className="mt-5 rounded-xl border border-line bg-elevated p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Demo control room</p>
              <button
                type="button"
                className="text-[11px] font-bold text-accent hover:underline"
                onClick={() => {
                  setEmail(DEMO.email);
                  setPassword(DEMO.password);
                  setError('');
                }}
              >
                Use demo login
              </button>
            </div>
            <p className="mt-1 text-xs text-body">
              {DEMO.email} <span className="text-muted">/</span> {DEMO.password}
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-muted">
              Dummy demo account on the in-memory network. Never use this password in production.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
