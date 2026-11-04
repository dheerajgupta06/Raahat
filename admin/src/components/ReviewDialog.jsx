import { Loader2, ShieldCheck, XCircle } from 'lucide-react';
import { useState } from 'react';
import { api } from '../lib/api.js';
import { useAdmin } from '../context/AdminContext.jsx';

export default function ReviewDialog({ hospital, decision, onClose, onDone }) {
  const { token, pushToast, refreshPendingApprovals } = useAdmin();
  const reject = decision === 'reject';
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const canSubmit = !busy && (!reject || note.trim().length >= 4);

  const submit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError('');
    try {
      const result = await api.review(token, hospital.id, decision, note.trim());
      pushToast({
        title: result.message,
        message: `${hospital.name} is now ${reject ? 'rejected' : 'approved'}.`,
        tone: reject ? 'danger' : 'ok',
      });
      await refreshPendingApprovals();
      onDone();
    } catch (reviewError) {
      setError(reviewError.message || 'Could not save the decision');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={reject ? 'Reject registration' : 'Approve registration'}
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <form onSubmit={submit} className="panel w-full max-w-md rounded-b-none p-5 sm:rounded-2xl">
        <div className="flex items-start gap-3">
          <span
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
              reject ? 'bg-danger/10 text-danger ring-1 ring-danger/30' : 'bg-ok/10 text-ok ring-1 ring-ok/30'
            }`}
          >
            {reject ? <XCircle size={20} /> : <ShieldCheck size={20} />}
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
              {reject ? 'Reject certificate' : 'Approve certificate'}
            </p>
            <h2 className="truncate text-lg font-black tracking-tight text-body">{hospital.name}</h2>
            <p className="text-xs text-muted">
              {hospital.city}, {hospital.state} · {hospital.type}
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-muted">
          {reject
            ? 'The hospital will see this as rejected and can contact support. Add a clear reason so the team can fix the submission.'
            : 'The hospital will be marked as approved so it can operate on the public network. You can still reject it later from the queue.'}
        </p>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-xs font-semibold text-muted">
            {reject ? 'Reason for rejection (required)' : 'Internal note (optional)'}
          </span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            maxLength={400}
            className="field resize-none"
            placeholder={
              reject
                ? 'e.g. Certificate scan is unreadable, upload a clear copy'
                : 'e.g. Verified against state registration portal'
            }
          />
          <span className="mt-1 block text-right text-[10px] text-muted">{note.length}/400</span>
        </label>

        {error && (
          <p className="mt-2 rounded-lg border border-danger/35 bg-danger/10 px-3 py-2 text-xs font-semibold text-danger">
            {error}
          </p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" className="btn-outline" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="submit"
            className={reject ? 'btn-reject' : 'btn-approve'}
            disabled={!canSubmit}
          >
            {busy && <Loader2 size={16} className="animate-spin" />}
            {busy ? 'Saving…' : reject ? 'Reject' : 'Approve'}
          </button>
        </div>
      </form>
    </div>
  );
}
