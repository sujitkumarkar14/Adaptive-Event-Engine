import React, { useEffect, useMemo } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useEntryStore } from '../../store/entryStore';
import { useAuth } from '../../contexts/AuthContext';

export { TopNavBar } from './TopNavBar';

type NavItem = {
  /** Sidebar + accessibility */
  name: string;
  /** Mobile bottom strip — short labels avoid truncation glitches (e.g. “Aero” → garbled glyphs). */
  shortName: string;
  icon: string;
  path: string;
};

/** Attendee-safe routes (always shown). */
const ATTENDEE_NAV_ITEMS: NavItem[] = [
  { name: 'Check-in', shortName: 'Scan', icon: 'qr_code_scanner', path: '/check-in' },
  { name: 'Transit', shortName: 'Transit', icon: 'directions_bus', path: '/onboarding' },
  { name: 'Booking', shortName: 'Book', icon: 'schedule', path: '/booking' },
  { name: 'Event Pass', shortName: 'Pass', icon: 'qr_code', path: '/vouchers' },
  { name: 'Dashboard', shortName: 'Dash', icon: 'dashboard', path: '/dashboard' },
  { name: 'Concierge', shortName: 'Help', icon: 'support_agent', path: '/concierge' },
];

const OPS_NAV_ITEMS: NavItem[] = [
  { name: 'Staff ops', shortName: 'Staff', icon: 'admin_panel_settings', path: '/staff' },
  { name: 'Traffic', shortName: 'Traffic', icon: 'traffic', path: '/command/traffic' },
  { name: 'Aero', shortName: 'Aero', icon: 'air', path: '/command/aero' },
  { name: 'Gates', shortName: 'Gates', icon: 'door_front', path: '/command/gates' },
];

function useNavItemsForRole(): NavItem[] {
  const { hasRole } = useAuth();
  return useMemo(() => {
    if (hasRole('staff')) {
      return [...ATTENDEE_NAV_ITEMS, ...OPS_NAV_ITEMS];
    }
    return ATTENDEE_NAV_ITEMS;
  }, [hasRole]);
}

export const SideNavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const navItems = useNavItemsForRole();

  const portalSubtitle = hasRole('staff') ? 'Operations & Attendee' : 'Attendee Portal';

  return (
    <nav
      className="hidden md:flex fixed left-0 top-0 h-full w-72 bg-[#faf9fd] dark:bg-[#1a1b1e] border-r-[1px] border-[#727785] flex-col pt-8 z-40"
      aria-label="Primary"
    >
      <div className="px-8 mt-12 mb-12">
        <div className="text-2xl font-black mb-1 uppercase tracking-tighter">{portalSubtitle}</div>
        <div className="text-[10px] font-bold text-primary-container tracking-widest uppercase">System Status: Active</div>
      </div>
      <div className="flex flex-col grow overflow-y-auto min-h-0">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`p-4 border-b border-[#c1c6d6] uppercase tracking-widest text-xs flex items-center gap-4 ${
                isActive
                  ? 'bg-[#1A73E8] text-white font-bold'
                  : 'text-[#1a1b1e] dark:text-[#faf9fd] hover:bg-[#f4f3f7] dark:hover:bg-[#2f3033]'
              }`}
            >
              <span
                className="material-symbols-outlined normal-case shrink-0"
                style={{ fontVariationSettings: `'FILL' ${isActive ? 1 : 0}` }}
              >
                {item.icon}
              </span>
              {item.name}
            </Link>
          );
        })}
      </div>
      <div className="p-6">
        <button
          type="button"
          className="w-full border-2 border-error text-error py-3 font-bold uppercase tracking-widest text-[10px] hover:bg-error hover:text-white transition-colors min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2"
          onClick={() => navigate('/dashboard#priority-assistance')}
        >
          Emergency Assistance
        </button>
        <p className="mt-2 text-[9px] font-bold uppercase tracking-wider text-outline leading-tight">
          Opens dashboard SOS — no staff login required
        </p>
      </div>
    </nav>
  );
};

export const BottomNav = () => {
  const location = useLocation();
  const { state, dispatch } = useEntryStore();
  const navItems = useNavItemsForRole();

  useEffect(() => {
    if (!state.a11yStatus) return;
    const id = window.setTimeout(() => dispatch({ type: 'CLEAR_A11Y' }), 4000);
    return () => window.clearTimeout(id);
  }, [state.a11yStatus, dispatch]);

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 w-full bg-surface border-t-[1px] border-outline-variant flex flex-nowrap h-16 z-50 overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:thin]"
      style={{ WebkitOverflowScrolling: 'touch' }}
      aria-label="Primary mobile navigation"
    >
      <div aria-live="polite" role="status" className="sr-only">
        {state.a11yStatus}
      </div>
      {navItems.map((item) => {
        const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-shrink-0 flex-col items-center justify-center min-w-[4.25rem] max-w-[5.25rem] px-1 ${
              isActive ? 'text-primary-container' : 'text-outline hover:text-on-surface'
            }`}
          >
            <span
              className="material-symbols-outlined normal-case text-[22px]"
              style={{ fontVariationSettings: `'FILL' ${isActive ? 1 : 0}` }}
            >
              {item.icon}
            </span>
            <span className="text-[8px] uppercase font-bold mt-0.5 text-center leading-none whitespace-nowrap">
              {item.shortName}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

export const DataFreshnessFooter = () => {
  const { state } = useEntryStore();
  const refreshed = state.lastSyncTimestamp ?? state.dataFreshness;

  return (
    <footer className="fixed bottom-16 md:bottom-0 left-0 w-full bg-surface-container-highest border-t-[1px] border-outline-variant px-6 py-2 flex justify-between items-center z-50">
      <span className={`text-[10px] font-bold uppercase tracking-[0.1em] ${state.isOnline ? 'text-secondary' : 'text-error'}`}>
        Sync Status: {state.isOnline ? 'Live' : 'Offline'}
      </span>
      <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-on-surface-variant text-right" aria-live="polite">
        Last sync:{' '}
        {refreshed
          ? refreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          : '—'}
      </span>
    </footer>
  );
};
