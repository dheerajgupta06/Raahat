import {
  Bell,
  Building2,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Radio,
  ShieldCheck,
} from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext.jsx';
import { PUBLIC_SITE_URL } from '../lib/config.js';
import { initials } from '../lib/format.js';
import Brand from './Brand.jsx';

const NAV = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/approvals', label: 'Approvals', icon: ShieldCheck, badge: 'pending' },
  { to: '/hospitals', label: 'Hospitals', icon: Building2 },
  { to: '/alerts', label: 'Alerts', icon: Bell, badge: 'unread' },
];

const TITLES = {
  '/': ['Network overview', 'Live hospital capacity and registration queue'],
  '/approvals': ['Registration approvals', 'Verify certificates before hospitals go live'],
  '/hospitals': ['Hospital registry', 'Search, inspect and verify contact details'],
  '/alerts': ['Control-room alerts', 'Everything the network reported recently'],
};

function Badge({ value }) {
  if (!value) return null;
  return (
    <span className="ml-auto grid min-w-[20px] place-items-center rounded-full bg-danger px-1.5 text-[10px] font-black text-white">
      {value > 99 ? '99+' : value}
    </span>
  );
}

export default function Layout() {
  const { admin, unread, pendingApprovals, logout, connected } = useAdmin();
  const { pathname } = useLocation();
  const [title, subtitle] = TITLES[pathname] || TITLES['/'];

  const badgeFor = (kind) =>
    kind === 'unread' ? unread : kind === 'pending' ? pendingApprovals : 0;

  return (
    <div className="min-h-screen bg-bg bg-console">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-surface/85 backdrop-blur lg:flex">
        <div className="border-b border-line px-5 py-5">
          <Brand />
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                <Badge value={item.badge ? badgeFor(item.badge) : 0} />
              </NavLink>
            );
          })}

          <div className="my-3 h-px bg-line" />

          {PUBLIC_SITE_URL && (
            <a
              href={PUBLIC_SITE_URL}
              target="_blank"
              rel="noreferrer"
              className="nav-link"
            >
              <ExternalLink size={18} />
              <span>Public website</span>
            </a>
          )}
        </nav>

        <div className="border-t border-line p-3">
          <div className="flex items-center gap-2.5 rounded-xl bg-elevated p-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-xs font-black text-accent">
              {initials(admin?.name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-bold text-body">{admin?.name || 'Control room'}</span>
              <span className="block truncate text-[10px] text-muted">{admin?.email || ''}</span>
            </span>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg p-2 text-muted transition hover:bg-surface hover:text-danger"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="lg:hidden">
              <Brand compact />
            </div>

            <div className="hidden min-w-0 flex-1 lg:block">
              <h1 className="truncate text-lg font-black tracking-tight text-body">{title}</h1>
              <p className="truncate text-xs text-muted">{subtitle}</p>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <span
                className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider sm:inline-flex ${
                  connected
                    ? 'border-ok/30 bg-ok/10 text-ok'
                    : 'border-warn/30 bg-warn/10 text-warn'
                }`}
              >
                <Radio size={11} className={connected ? 'animate-pulse' : ''} />
                {connected ? 'Live' : 'Polling'}
              </span>

              <NavLink to="/alerts" className="icon-btn" aria-label="Alerts">
                <Bell size={18} />
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 grid min-w-[18px] place-items-center rounded-full bg-danger px-1 text-[9px] font-black text-white">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </NavLink>

              <button
                type="button"
                onClick={logout}
                className="icon-btn lg:hidden"
                aria-label="Sign out"
              >
                <LogOut size={17} />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10">
          <Outlet />
        </main>
      </div>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur lg:hidden">
        <div className="grid grid-cols-4">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `relative flex min-h-[58px] flex-col items-center justify-center gap-1 text-[10px] font-bold ${
                    isActive ? 'text-accent' : 'text-muted'
                  }`
                }
              >
                <Icon size={19} />
                <span>{item.label}</span>
                {item.badge && badgeFor(item.badge) > 0 && (
                  <span className="absolute right-[22%] top-1.5 grid min-w-[16px] place-items-center rounded-full bg-danger px-1 text-[9px] font-black text-white">
                    {badgeFor(item.badge) > 99 ? '99+' : badgeFor(item.badge)}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
