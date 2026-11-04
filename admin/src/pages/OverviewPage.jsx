import {
  ArrowRight,
  BadgeCheck,
  BedDouble,
  BellRing,
  Building2,
  ExternalLink,
  Eye,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Wind,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DocumentModal from '../components/DocumentModal.jsx';
import { useAdmin } from '../context/AdminContext.jsx';
import { api } from '../lib/api.js';
import { PUBLIC_SITE_URL } from '../lib/config.js';
import { timeAgo } from '../lib/format.js';

const TONES = {
  warn: 'text-warn bg-warn/10 ring-warn/25',
  accent: 'text-accent bg-accent-soft/60 ring-accent/25',
  ok: 'text-ok bg-ok/10 ring-ok/25',
  danger: 'text-danger bg-danger/10 ring-danger/25',
};

function StatTile({ icon: Icon, label, value, hint, tone = 'accent', to }) {
  const content = (
    <div className="panel flex h-full items-start gap-3 p-3.5 transition hover:border-accent/30">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ring-1 ${TONES[tone]}`}>
        <Icon size={17} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[10px] font-bold uppercase tracking-wider text-muted">{label}</span>
        <span className="mt-0.5 block text-2xl font-black leading-none tracking-tight text-body">{value}</span>
        {hint && <span className="mt-1 block truncate text-[10px] text-muted">{hint}</span>}
      </span>
    </div>
  );
  return to ? (
    <Link to={to} className="block">
      {content}
    </Link>
  ) : (
    content
  );
}

export default function OverviewPage() {
  const {
    token,
    liveTick,
    notifications,
    unread,
    enableBrowserAlerts,
    notificationPermission,
    pushToast,
  } = useAdmin();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [docTarget, setDocTarget] = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setLoading(true);
    try {
      const result = await api.overview(token);
      setOverview(result.data);
      setError('');
    } catch (loadError) {
      setError(loadError.message || 'Could not load the control room');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load(false);
  }, [load]);

  useEffect(() => {
    if (!liveTick) return;
    load(true);
  }, [liveTick]); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = overview?.stats;
  const pendingQueue = (overview?.recentRegistrations || []).filter(
    (hospital) => hospital.registration?.status === 'pending'
  );
  const bedRatio = stats?.bedsTotal ? Math.round((stats.bedsAvailable / stats.bedsTotal) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="label-xs">Control room</p>
          <h2 className="text-xl font-black tracking-tight text-body">Network overview</h2>
        </div>
        <div className="flex items-center gap-2">
          {PUBLIC_SITE_URL && (
            <a href={PUBLIC_SITE_URL} target="_blank" rel="noreferrer" className="btn-ghost min-h-[38px] px-3 text-xs">
              <ExternalLink size={14} /> Public site
            </a>
          )}
          <button type="button" onClick={load} className="btn-outline min-h-[38px] px-3 text-xs" disabled={loading}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="panel border-danger/35 bg-danger/10 p-4 text-sm text-danger">
          {error}{' '}
          <button type="button" onClick={load} className="font-bold underline">
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
        <StatTile
          icon={ShieldCheck}
          label="Pending"
          value={loading && !stats ? '—' : stats?.pending ?? 0}
          hint="Certificates to review"
          tone="warn"
          to="/approvals"
        />
        <StatTile
          icon={Building2}
          label="Hospitals"
          value={loading && !stats ? '—' : stats?.hospitals ?? 0}
          hint={`${stats?.unregistered ?? 0} without certificate`}
          to="/hospitals"
        />
        <StatTile
          icon={BedDouble}
          label="Beds free"
          value={loading && !stats ? '—' : stats?.bedsAvailable ?? 0}
          hint={`of ${stats?.bedsTotal ?? 0} network beds`}
          tone="ok"
        />
        <StatTile
          icon={Wind}
          label="O₂ ready"
          value={loading && !stats ? '—' : stats?.oxygenReady ?? 0}
          hint="Marked available"
          tone="ok"
        />
        <StatTile
          icon={BadgeCheck}
          label="Verified"
          value={loading && !stats ? '—' : stats?.contactsVerified ?? 0}
          hint="Contacts · 30 days"
          tone="accent"
        />
        <StatTile
          icon={BellRing}
          label="Alerts"
          value={unread}
          hint="Unread pushes"
          tone={unread ? 'danger' : 'accent'}
          to="/alerts"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
        <section className="panel p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-black text-body">Registration queue</h3>
              <p className="text-[11px] text-muted">Newest certificates waiting for a decision</p>
            </div>
            <Link to="/approvals" className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline">
              Open queue <ArrowRight size={13} />
            </Link>
          </div>

          <div className="mt-3 space-y-2">
            {loading && !overview && (
              <>
                <div className="skeleton h-16" />
                <div className="skeleton h-16" />
              </>
            )}

            {!loading && pendingQueue.length === 0 && (
              <div className="rounded-xl border border-dashed border-line px-4 py-8 text-center">
                <p className="text-sm font-bold text-body">Nothing waiting</p>
                <p className="mt-1 text-xs text-muted">New hospital registrations will appear here automatically.</p>
              </div>
            )}

            {pendingQueue.map((hospital) => (
              <div key={hospital.id} className="panel-elevated flex items-center gap-3 p-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-warn/10 text-warn ring-1 ring-warn/25">
                  <ShieldCheck size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-body">{hospital.name}</p>
                  <p className="truncate text-[11px] text-muted">
                    {hospital.city} · applied {timeAgo(hospital.registration?.uploadedAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDocTarget(hospital)}
                  className="icon-btn h-9 w-9 min-h-9 min-w-9"
                  aria-label={`View certificate for ${hospital.name}`}
                >
                  <Eye size={15} />
                </button>
                <Link
                  to="/approvals"
                  className="btn-outline min-h-[36px] px-3 text-[11px]"
                >
                  Review
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="panel p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-black text-body">Live alerts</h3>
              <p className="text-[11px] text-muted">Pushed over the realtime channel</p>
            </div>
            <Link to="/alerts" className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline">
              All alerts <ArrowRight size={13} />
            </Link>
          </div>

          {notificationPermission !== 'granted' && (
            <button
              type="button"
              onClick={async () => {
                const permission = await enableBrowserAlerts();
                if (permission === 'granted') pushToast({ title: 'Alerts on', message: 'This device will now show registration alerts.', tone: 'ok' });
              }}
              className="mt-3 flex w-full items-center gap-2 rounded-xl border border-warn/30 bg-warn/10 px-3 py-2 text-left text-[11px] font-semibold text-warn"
            >
              <BellRing size={14} />
              Enable device notifications for instant alerts
            </button>
          )}

          <ul className="mt-3 space-y-2">
            {notifications.slice(0, 5).map((item) => (
              <li key={item.id} className="flex gap-2.5 rounded-xl bg-elevated/60 p-2.5">
                <span
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                    item.read ? 'bg-line' : 'bg-accent shadow-[0_0_8px_rgba(45,226,230,0.8)]'
                  }`}
                />
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-body">{item.title}</p>
                  <p className="line-clamp-2 text-[11px] leading-relaxed text-muted">{item.message}</p>
                  <p className="mt-0.5 text-[10px] text-muted/80">{timeAgo(item.createdAt)}</p>
                </div>
              </li>
            ))}
            {notifications.length === 0 && !loading && (
              <li className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-xs text-muted">
                No alerts yet. Submit a hospital registration to see it land here.
              </li>
            )}
          </ul>
        </section>
      </div>

      <section className="panel p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-body">Bed capacity</h3>
            <p className="text-[11px] text-muted">Live availability reported by hospitals</p>
          </div>
          <span className="text-xs font-bold text-body">
            {stats?.bedsAvailable ?? 0} <span className="text-muted">of {stats?.bedsTotal ?? 0} free</span>
          </span>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-elevated ring-1 ring-inset ring-line">
          <div
            className="h-full rounded-full bg-gradient-to-r from-ok/60 to-ok transition-all"
            style={{ width: `${Math.min(100, bedRatio)}%` }}
          />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted">
          <span>{bedRatio}% of network beds free</span>
          <span>{stats?.pending ?? 0} certificates pending review</span>
          <span>{stats?.unregistered ?? 0} hospitals without a certificate</span>
        </div>
      </section>

      {docTarget && <DocumentModal hospital={docTarget} onClose={() => setDocTarget(null)} />}
    </div>
  );
}
