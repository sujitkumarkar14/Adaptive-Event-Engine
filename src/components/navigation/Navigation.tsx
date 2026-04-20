import React, { useEffect, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useEntryStore } from '../../store/entryStore';
import { useAuth } from '../../contexts/AuthContext';

type NavItem = { name: string; icon: string; path: string };

export const TopNavBar = () => {
  return (
    <header className="bg-[#faf9fd] dark:bg-[#1a1b1e] border-b-[1px] border-[#727785] flex justify-between items-center w-full px-6 py-4 h-16 fixed top-0 z-50">
      <div className="text-xl font-black text-[#1a1b1e] dark:text-[#faf9fd] tracking-widest font-['Inter'] uppercase">
        ACCESS
      </div>
      <div className="flex items-center gap-4">
        <span
          className="material-symbols-outlined normal-case text-[#727785] cursor-pointer"
          style={{ fontVariationSettings: "'FILL' 0" }}
          aria-hidden
        >
          account_circle
        </span>
        <span
          className="material-symbols-outlined normal-case text-[#727785] cursor-pointer"
          style={{ fontVariationSettings: "'FILL' 0" }}
          aria-hidden
        >
          settings
        </span>
      </div>
    </header>
  );
};

function useSideNavItems(): NavItem[] {
  const { hasRole } = useAuth();
  return useMemo(() => {
    const base: NavItem[] = [
      { name: 'Transit', icon: 'directions_bus', path: '/onboarding' },
      { name: 'Booking', icon: 'schedule', path: '/booking' },
      { name: 'Event Pass', icon: 'qr_code', path: '/vouchers' },
      { name: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    ];
    if (!hasRole('staff')) return base;
    return [
      ...base,
      { name: 'Staff ops', icon: 'admin_panel_settings', path: '/staff' },
      { name: 'Traffic', icon: 'traffic', path: '/command/traffic' },
      { name: 'Aero', icon: 'air', path: '/command/aero' },
      { name: 'Gates', icon: 'door_front', path: '/command/gates' },
    ];
  }, [hasRole]);
}

export const SideNavBar = () => {
  const location = useLocation();
  const { hasRole } = useAuth();
  const navItems = useSideNavItems();

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
      <div className="flex flex-col grow">
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
          className="w-full border-2 border-error text-error py-3 font-bold uppercase tracking-widest text-[10px] hover:bg-error hover:text-white transition-colors"
        >
          Emergency Assistance
        </button>
      </div>
    </nav>
  );
};

function useBottomNavItems(): NavItem[] {
  const { hasRole } = useAuth();
  return useMemo(() => {
    if (!hasRole('staff')) {
      return [
        { name: 'Transit', icon: 'directions_bus', path: '/onboarding' },
        { name: 'Booking', icon: 'schedule', path: '/booking' },
        { name: 'Pass', icon: 'qr_code', path: '/vouchers' },
        { name: 'Dash', icon: 'dashboard', path: '/dashboard' },
      ];
    }
    return [
      { name: 'Staff', icon: 'admin_panel_settings', path: '/staff' },
      { name: 'Traffic', icon: 'traffic', path: '/command/traffic' },
      { name: 'Gates', icon: 'door_front', path: '/command/gates' },
      { name: 'Dash', icon: 'dashboard', path: '/dashboard' },
    ];
  }, [hasRole]);
}

export const BottomNav = () => {
  const location = useLocation();
  const { state, dispatch } = useEntryStore();
  const navItems = useBottomNavItems();

  useEffect(() => {
    if (!state.a11yStatus) return;
    const id = window.setTimeout(() => dispatch({ type: 'CLEAR_A11Y' }), 4000);
    return () => window.clearTimeout(id);
  }, [state.a11yStatus, dispatch]);

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 w-full bg-surface border-t-[1px] border-outline-variant grid grid-cols-4 h-16 z-50"
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
            className={`flex flex-col items-center justify-center ${
              isActive ? 'text-primary-container' : 'text-outline hover:text-on-surface'
            }`}
          >
            <span
              className="material-symbols-outlined normal-case"
              style={{ fontVariationSettings: `'FILL' ${isActive ? 1 : 0}` }}
            >
              {item.icon}
            </span>
            <span className="text-[8px] uppercase font-bold mt-1">{item.name}</span>
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
