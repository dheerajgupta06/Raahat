import { Download, ExternalLink, FileText, Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAdmin } from '../context/AdminContext.jsx';
import { fetchRegistrationDocument } from '../lib/api.js';
import { formatFileSize } from '../lib/format.js';

export default function DocumentModal({ hospital, onClose }) {
  const { token } = useAdmin();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const document = hospital?.registration?.document;

  useEffect(() => {
    if (!document) return undefined;
    let cancelled = false;
    let objectUrl = '';
    setLoading(true);
    setError('');
    fetchRegistrationDocument(token, hospital.id)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch((downloadError) => {
        if (!cancelled) setError(downloadError.message || 'Could not load the document');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [token, hospital?.id, document]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!document) return null;
  const isImage = document.mimeType.startsWith('image/');

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Registration certificate"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="panel flex h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-b-none sm:h-[82vh] sm:rounded-2xl">
        <div className="flex items-start gap-3 border-b border-line p-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-soft/60 text-accent">
            <FileText size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-body">{hospital.name}</p>
            <p className="truncate text-[11px] text-muted">
              {document.originalName} · {formatFileSize(document.size)}
            </p>
          </div>
          {url && (
            <>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="icon-btn h-9 w-9 min-h-9 min-w-9"
                aria-label="Open document in a new tab"
                title="Open in new tab"
              >
                <ExternalLink size={15} />
              </a>
              <a
                href={url}
                download={document.originalName}
                className="icon-btn h-9 w-9 min-h-9 min-w-9"
                aria-label="Download document"
                title="Download"
              >
                <Download size={15} />
              </a>
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            className="icon-btn h-9 w-9 min-h-9 min-w-9"
            aria-label="Close preview"
          >
            <X size={16} />
          </button>
        </div>

        <div className="relative flex-1 overflow-hidden bg-bg">
          {loading && (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-muted">
              <Loader2 size={22} className="animate-spin text-accent" />
              <p className="text-xs font-semibold">Loading certificate…</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
              <p className="text-sm font-bold text-danger">{error}</p>
              <p className="text-xs text-muted">Check that the uploaded file still exists on the server.</p>
            </div>
          )}

          {!loading && !error && url && isImage && (
            <img src={url} alt={`Registration certificate for ${hospital.name}`} className="h-full w-full object-contain" />
          )}

          {!loading && !error && url && !isImage && (
            <iframe src={url} title={`Registration certificate for ${hospital.name}`} className="h-full w-full bg-white" />
          )}
        </div>

        {!loading && !error && url && !isImage && (
          <p className="border-t border-line px-4 py-2 text-[10px] text-muted">
            If the PDF preview stays blank on your phone, use the open-in-new-tab button above.
          </p>
        )}
      </div>
    </div>
  );
}
