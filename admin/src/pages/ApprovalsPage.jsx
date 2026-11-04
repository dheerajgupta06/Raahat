import {
  BedDouble,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  User,
  Wind,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import DocumentModal from '../components/DocumentModal.jsx';
import ReviewDialog from '../components/ReviewDialog.jsx';
import StatusChip from '../components/StatusChip.jsx';
import { useAdmin } from '../context/AdminContext.jsx';
import { api } from '../lib/api.js';
import { formatDate, formatFileSize, timeAgo } from '../lib/format.js';

const TABS = [
  { id: 'pending', label: 'Pending', icon: Clock3 },
  { id: 'verified', label: 'Approved', icon: CheckCircle2 },
  { id: 'all', label: 'All', icon: ShieldCheck },
];

const EMPTY_COPY = {
  pending: ['Queue is clear', 'No certificate is waiting for review right now.'],
  verified: ['No approvals yet', 'Approved hospitals will be listed here.'],
  all: ['No registrations yet', 'Hospitals that upload a certificate will show up here.'],
};

function ApplicationCard({ hospital, onView, onDecision }) {
  const pending = hospital.registration?.status === 'pending';
  const doc = hospital.registration?.document;
  const specialties = hospital.specialties || [];

  return (
    <article className="panel p-3.5">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft/60 text-accent ring-1 ring-accent/25">
          <ShieldCheck size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 break-words text-sm font-black leading-snug text-body">{hospital.name}</h3>
            <StatusChip status={hospital.registration?.status || 'pending'} />
          </div>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted">
            <span className="inline-flex items-center gap-1">
              <MapPin size={11} /> {hospital.city}, {hospital.state}
            </span>
            <span>·</span>
            <span>{hospital.type}</span>
            {hospital.is24x7 && (
              <>
                <span>·</span>
                <span>24x7</span>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-2 rounded-xl bg-elevated/60 p-2.5 text-[11px] sm:grid-cols-2">
        <p className="flex min-w-0 items-center gap-1.5 text-muted">
          <User size={12} className="shrink-0" />
          <span className="truncate text-body">{hospital.applicant?.name || 'Hospital administrator'}</span>
        </p>
        <p className="flex min-w-0 items-center gap-1.5 text-muted">
          <Mail size={12} className="shrink-0" />
          <span className="truncate">{hospital.applicant?.email || '—'}</span>
        </p>
        <p className="flex min-w-0 items-center gap-1.5 text-muted">
          <Phone size={12} className="shrink-0" />
          <span className="truncate">{hospital.contacts?.reception?.phone || '—'}</span>
        </p>
        <p className="flex min-w-0 items-center gap-1.5 text-muted">
          <BedDouble size={12} className="shrink-0" />
          <span className="truncate">
            {hospital.availableBeds}/{hospital.totalBeds} beds free
          </span>
        </p>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {specialties.slice(0, 4).map((specialty) => (
          <span key={specialty} className="chip min-h-[24px] px-2 py-0.5 text-[10px]">
            {specialty}
          </span>
        ))}
        {specialties.length > 4 && (
          <span className="chip min-h-[24px] px-2 py-0.5 text-[10px]">+{specialties.length - 4}</span>
        )}
        <span className="chip min-h-[24px] gap-1 px-2 py-0.5 text-[10px]">
          <Wind size={10} /> O₂ {hospital.oxygenStatus}
        </span>
      </div>

      {doc && (
        <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-line bg-surface px-2.5 py-2">
          <FileText size={15} className="shrink-0 text-accent" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold text-body">{doc.originalName}</p>
            <p className="text-[10px] text-muted">
              {formatFileSize(doc.size)} · uploaded {timeAgo(hospital.registration?.uploadedAt)}
            </p>
          </div>
          <button type="button" onClick={onView} className="btn-outline min-h-[34px] px-2.5 text-[10px]">
            <Eye size={13} /> View
          </button>
        </div>
      )}

      {hospital.registration?.note && (
        <p className="mt-2 rounded-lg border border-danger/25 bg-danger/5 px-2.5 py-1.5 text-[11px] text-danger">
          <span className="font-bold">Review note:</span> {hospital.registration.note}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2.5">
        <p className="text-[10px] text-muted">
          {hospital.registration?.reviewedAt
            ? `Reviewed ${formatDate(hospital.registration.reviewedAt)}`
            : `Applied ${formatDate(hospital.registration?.uploadedAt || hospital.createdAt)}`}
        </p>
        {pending && (
          <div className="flex gap-2">
            <button type="button" onClick={() => onDecision('reject')} className="btn-reject min-h-[36px] px-3 text-[11px]">
              <XCircle size={14} /> Reject
            </button>
            <button type="button" onClick={() => onDecision('approve')} className="btn-approve min-h-[36px] px-3 text-[11px]">
              <CheckCircle2 size={14} /> Approve
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

export default function ApprovalsPage() {
  const { token, liveTick } = useAdmin();
  const [status, setStatus] = useState('pending');
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, verified: 0, all: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [docTarget, setDocTarget] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);

  const load = useCallback(
    async (silent = false) => {
      if (!token) return;
      if (silent) setRefreshing(true);
      else setLoading(true);
      try {
        const result = await api.registrations(token, status);
        setItems(result.data || []);
        setCounts(result.meta?.counts || { pending: 0, verified: 0, all: 0 });
        setError('');
      } catch (loadError) {
        setError(loadError.message || 'Could not load the approval queue');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, status]
  );

  useEffect(() => {
    load(false);
  }, [load]);

  useEffect(() => {
    if (!liveTick) return;
    load(true);
  }, [liveTick]); // eslint-disable-line react-hooks/exhaustive-deps

  const empty = EMPTY_COPY[status] || EMPTY_COPY.all;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="label-xs">Verification</p>
          <h2 className="text-xl font-black tracking-tight text-body">Hospital registrations</h2>
          <p className="text-[11px] text-muted">
            {counts.pending} pending · {counts.verified} approved
          </p>
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

      <div className="thin-scrollbar -mx-1 grid grid-cols-3 gap-1.5 px-1 pb-1 sm:flex sm:gap-2 sm:overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const count = counts[tab.id] ?? 0;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatus(tab.id)}
              className={`tab min-w-0 justify-center px-1.5 text-[11px] sm:min-w-[unset] sm:shrink-0 sm:px-3 sm:text-xs ${
                status === tab.id ? 'tab-active' : ''
              }`}
            >
              <Icon size={13} className="hidden shrink-0 sm:block" />
              {tab.label}
              <span className={`ml-0.5 ${status === tab.id ? 'text-accent' : 'text-muted'}`}>{count}</span>
            </button>
          );
        })}
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
          <div className="skeleton h-44" />
          <div className="skeleton h-44" />
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="panel flex flex-col items-center gap-2 px-4 py-14 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ok/10 text-ok ring-1 ring-ok/25">
            <CheckCircle2 size={22} />
          </span>
          <p className="text-sm font-black text-body">{empty[0]}</p>
          <p className="max-w-xs text-xs leading-relaxed text-muted">{empty[1]}</p>
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        {items.map((hospital) => (
          <ApplicationCard
            key={hospital.id}
            hospital={hospital}
            onView={() => setDocTarget(hospital)}
            onDecision={(decision) => setReviewTarget({ hospital, decision })}
          />
        ))}
      </div>

      {items.length > 0 && (
        <p className="px-1 text-[10px] text-muted">
          Showing {items.length} {status === 'all' ? 'registration' : status} record{items.length === 1 ? '' : 's'}.
          New submissions arrive live without a refresh.
        </p>
      )}

      {docTarget && <DocumentModal hospital={docTarget} onClose={() => setDocTarget(null)} />}

      {reviewTarget && (
        <ReviewDialog
          hospital={reviewTarget.hospital}
          decision={reviewTarget.decision}
          onClose={() => setReviewTarget(null)}
          onDone={() => {
            setReviewTarget(null);
            load(true);
          }}
        />
      )}
    </div>
  );
}
