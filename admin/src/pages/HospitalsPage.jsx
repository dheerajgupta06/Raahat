import {
  BadgeCheck,
  BedDouble,
  Building2,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Wind,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import DocumentModal from '../components/DocumentModal.jsx';
import StatusChip from '../components/StatusChip.jsx';
import { useAdmin } from '../context/AdminContext.jsx';
import { api } from '../lib/api.js';
import { PUBLIC_SITE_URL } from '../lib/config.js';
import { timeAgo } from '../lib/format.js';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'verified', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'unregistered', label: 'No certificate' },
];

export default function HospitalsPage() {
  const { token, liveTick, pushToast } = useAdmin();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, verified: 0, rejected: 0, unregistered: 0, all: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [docTarget, setDocTarget] = useState(null);
  const [verifyingId, setVerifyingId] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const load = useCallback(
    async (silent = false) => {
      if (!token) return;
      if (silent) setRefreshing(true);
      else setLoading(true);
      try {
        const result = await api.hospitals(token, { q: debouncedQuery, status });
        setItems(result.data || []);
        setCounts(result.meta?.counts || { pending: 0, verified: 0, rejected: 0, unregistered: 0, all: 0 });
        setError('');
      } catch (loadError) {
        setError(loadError.message || 'Could not load hospitals');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, debouncedQuery, status]
  );

  useEffect(() => {
    load(false);
  }, [load]);

  useEffect(() => {
    if (!liveTick) return;
    load(true);
  }, [liveTick]); // eslint-disable-line react-hooks/exhaustive-deps

  const verifyContacts = async (hospital) => {
    const confirmed = window.confirm(
      `Mark ${hospital.name} contact numbers as verified? The verified badge will appear publicly for 30 days.`
    );
    if (!confirmed) return;
    setVerifyingId(hospital.id);
    try {
      const result = await api.verifyContacts(token, hospital.id);
      setItems((list) => list.map((item) => (item.id === result.data.id ? result.data : item)));
      pushToast({
        title: 'Contacts verified',
        message: `${hospital.name} now shows the public verified badge.`,
        tone: 'ok',
      });
    } catch (verifyError) {
      pushToast({ title: 'Could not verify contacts', message: verifyError.message, tone: 'danger' });
    } finally {
      setVerifyingId('');
    }
  };

  const filterCount = (id) =>
    id === 'all'
      ? (counts.all || 0) + (counts.unregistered || 0)
      : counts[id] ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="label-xs">Network directory</p>
          <h2 className="text-xl font-black tracking-tight text-body">Hospital registry</h2>
          <p className="text-[11px] text-muted">{items.length} listings in the current view</p>
        </div>
        <button
          type="button"
          onClick={() => load(true)}
          className="btn-outline min-h-[38px] px-3 text-xs"
          disabled={refreshing}
        >
          {refreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Refresh
        </button>
      </div>

      <div className="panel p-3">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="field pl-10 pr-10"
            placeholder="Search hospital, city or pincode"
            aria-label="Search hospitals"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted hover:bg-elevated hover:text-body"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="thin-scrollbar mt-2.5 flex gap-2 overflow-x-auto pb-0.5">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setStatus(filter.id)}
              className={`tab ${status === filter.id ? 'tab-active' : ''}`}
            >
              {filter.label}
              <span className={status === filter.id ? 'text-accent' : 'text-muted'}>{filterCount(filter.id)}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="panel border-danger/35 bg-danger/10 p-4 text-sm text-danger">
          {error}{' '}
          <button type="button" onClick={() => load(false)} className="font-bold underline">
            Retry
          </button>
        </div>
      )}

      {loading && items.length === 0 && (
        <div className="space-y-2">
          <div className="skeleton h-32" />
          <div className="skeleton h-32" />
          <div className="skeleton h-32" />
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="panel flex flex-col items-center gap-2 px-4 py-14 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-elevated text-muted ring-1 ring-line">
            <Building2 size={22} />
          </span>
          <p className="text-sm font-black text-body">No hospitals found</p>
          <p className="max-w-xs text-xs leading-relaxed text-muted">
            Try a different search or filter. New registrations appear here as soon as they are submitted.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {items.map((hospital) => {
          const doc = hospital.registration?.document;
          const verified = hospital.contacts?.verifiedRecently;
          return (
            <article key={hospital.id} className="panel p-3.5">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-elevated text-muted ring-1 ring-line">
                  <Building2 size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="min-w-0 break-words text-sm font-black leading-snug text-body">{hospital.name}</h3>
                    <StatusChip status={hospital.registration?.status || 'unregistered'} />
                    {hospital.isDemo && <span className="chip min-h-[22px] px-2 py-0 text-[9px]">DEMO</span>}
                  </div>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-muted">
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={11} /> {hospital.city}, {hospital.state} · {hospital.pincode}
                    </span>
                    <span>·</span>
                    <span>{hospital.type}</span>
                  </p>
                </div>
                {PUBLIC_SITE_URL && (
                  <a
                    href={`${PUBLIC_SITE_URL}/hospital/${hospital.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="icon-btn h-9 w-9 min-h-9 min-w-9"
                    title="Open public listing"
                    aria-label={`Open public listing for ${hospital.name}`}
                  >
                    <ExternalLink size={15} />
                  </a>
                )}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-elevated/60 p-2.5 text-[11px] sm:grid-cols-4">
                <p className="flex items-center gap-1.5 text-muted">
                  <BedDouble size={12} className="shrink-0" />
                  <span className="truncate text-body">
                    {hospital.availableBeds}/{hospital.totalBeds} free
                  </span>
                </p>
                <p className="flex items-center gap-1.5 text-muted">
                  <Wind size={12} className="shrink-0" />
                  <span className="truncate text-body">O₂ {hospital.oxygenStatus}</span>
                </p>
                <p className="flex min-w-0 items-center gap-1.5 text-muted">
                  <Phone size={12} className="shrink-0" />
                  <span className="truncate">{hospital.contacts?.reception?.phone || '—'}</span>
                </p>
                <p className="truncate text-muted">Updated {timeAgo(hospital.lastUpdated)}</p>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                {doc ? (
                  <button
                    type="button"
                    onClick={() => setDocTarget(hospital)}
                    className="chip min-h-[30px] gap-1 border-accent/30 text-accent"
                  >
                    <FileText size={12} /> Certificate
                    <Eye size={12} />
                  </button>
                ) : (
                  <span className="chip min-h-[30px] gap-1">
                    <FileText size={12} /> No certificate
                  </span>
                )}

                <span className="text-[10px] text-muted">
                  {verified
                    ? `Contacts verified ${timeAgo(hospital.contacts?.lastVerified)}`
                    : 'Contacts not verified'}
                </span>

                <button
                  type="button"
                  onClick={() => verifyContacts(hospital)}
                  disabled={verifyingId === hospital.id}
                  className="ml-auto btn-outline min-h-[34px] px-2.5 text-[10px]"
                >
                  {verifyingId === hospital.id ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <BadgeCheck size={13} />
                  )}
                  Verify contacts
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {items.length > 0 && (
        <p className="px-1 text-[10px] text-muted">
          Showing {items.length} hospital{items.length === 1 ? '' : 's'}. Verifying contacts publishes the verified
          badge on the public website for 30 days.
        </p>
      )}

      {docTarget && <DocumentModal hospital={docTarget} onClose={() => setDocTarget(null)} />}
    </div>
  );
}
