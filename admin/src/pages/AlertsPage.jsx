import {
  BadgeCheck,
  BellOff,
  BellRing,
  CheckCheck,
  CheckCircle2,
  FileCheck2,
  Loader2,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext.jsx';
import { timeAgo } from '../lib/format.js';

const TYPE_META = {
  registration_submitted: {
    icon: FileCheck2,
    tone: 'text-warn bg-warn/10 ring-warn/25',
    target: '/approvals',
  },
  registration_approved: {
    icon: CheckCircle2,
    tone: 'text-ok bg-ok/10 ring-ok/25',
    target: '/approvals',
  },
  registration_rejected: {
    icon: XCircle,
    tone: 'text-danger bg-danger/10 ring-danger/25',
    target: '/approvals',
  },
  contacts_verified: {
    icon: BadgeCheck,
    tone: 'text-accent bg-accent-soft/60 ring-accent/25',
    target: '/hospitals',
  },
};

export default function AlertsPage() {
  const {
    notifications,
    unread,
    markAllRead,
    markRead,
    notificationPermission,
    enableBrowserAlerts,
    loadNotifications,
  } = useAdmin();
  const navigate = useNavigate();
  const [marking, setMarking] = useState(false);

  const openAlert = async (item) => {
    if (!item.read) await markRead(item.id);
    const meta = TYPE_META[item.type];
    if (meta?.target) navigate(meta.target);
  };

  const markEverything = async () => {
    setMarking(true);
    await markAllRead();
    setMarking(false);
  };

  const permissionCopy =
    notificationPermission === 'granted'
      ? ['Device alerts are on', 'Registration and review alerts pop up on this device.', 'ok']
      : notificationPermission === 'denied'
        ? ['Notifications blocked', 'Allow notifications for this site in browser settings to receive alerts.', 'danger']
        : notificationPermission === 'unsupported'
          ? ['Device alerts unavailable', 'This browser does not support notifications.', 'muted']
          : ['Enable device alerts', 'Allow notifications so new registrations reach you even when this tab is in the background.', 'warn'];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="label-xs">Realtime feed</p>
          <h2 className="text-xl font-black tracking-tight text-body">Control-room alerts</h2>
          <p className="text-[11px] text-muted">
            {unread > 0 ? `${unread} unread` : 'All caught up'} · pushed over Socket.io
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadNotifications()}
            className="btn-ghost min-h-[38px] px-3 text-xs"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={markEverything}
            disabled={unread === 0 || marking}
            className="btn-outline min-h-[38px] px-3 text-xs"
          >
            {marking ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
            Mark all read
          </button>
        </div>
      </div>

      <section
        className={`panel flex flex-wrap items-center gap-3 p-3.5 ${
          permissionCopy[2] === 'ok' ? 'border-ok/30 bg-ok/5' : ''
        }`}
      >
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1 ${
            permissionCopy[2] === 'ok'
              ? 'bg-ok/10 text-ok ring-ok/25'
              : permissionCopy[2] === 'danger'
                ? 'bg-danger/10 text-danger ring-danger/25'
                : 'bg-warn/10 text-warn ring-warn/25'
          }`}
        >
          {notificationPermission === 'granted' ? <BellRing size={18} /> : <BellOff size={18} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-body">{permissionCopy[0]}</p>
          <p className="text-[11px] leading-relaxed text-muted">{permissionCopy[1]}</p>
        </div>
        {notificationPermission === 'default' && (
          <button type="button" onClick={enableBrowserAlerts} className="btn-primary min-h-[38px] px-3 text-xs">
            <BellRing size={14} /> Enable alerts
          </button>
        )}
        {notificationPermission === 'denied' && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-danger">
            <ShieldAlert size={13} /> Blocked
          </span>
        )}
      </section>

      {notifications.length === 0 ? (
        <div className="panel flex flex-col items-center gap-2 px-4 py-16 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-elevated text-muted ring-1 ring-line">
            <BellRing size={22} />
          </span>
          <p className="text-sm font-black text-body">No alerts yet</p>
          <p className="max-w-xs text-xs leading-relaxed text-muted">
            When a hospital submits or updates its certificate, the alert lands here instantly.
          </p>
        </div>
      ) : (
        <ol className="space-y-2">
          {notifications.map((item) => {
            const meta = TYPE_META[item.type] || TYPE_META.registration_submitted;
            const Icon = meta.icon;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => openAlert(item)}
                  className={`panel flex w-full items-start gap-3 p-3 text-left transition hover:border-accent/30 ${
                    item.read ? 'opacity-75' : 'border-accent/25'
                  }`}
                >
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ring-1 ${meta.tone}`}>
                    <Icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-bold text-body">{item.title}</span>
                      {!item.read && (
                        <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-accent shadow-[0_0_8px_rgba(45,226,230,0.8)]" />
                      )}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-relaxed text-muted">{item.message}</span>
                    <span className="mt-1 block text-[10px] text-muted/80">
                      {timeAgo(item.createdAt)}
                      {item.actor ? ` · ${item.actor}` : ''}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
