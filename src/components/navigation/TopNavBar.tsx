import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useAuth, DEMO_ROLE_STORAGE_KEY } from '../../contexts/AuthContext';
import { StarkButton } from '../common/StarkComponents';

const APP_VERSION = '0.0.0';

export const TopNavBar = () => {
  const navigate = useNavigate();
  const { user, loading, role, claimsRole, staffGates } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const closeAll = useCallback(() => {
    setAccountOpen(false);
    setSettingsOpen(false);
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        closeAll();
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [closeAll]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAll();
    };
    if (accountOpen || settingsOpen) {
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }
  }, [accountOpen, settingsOpen, closeAll]);

  const onSignOut = async () => {
    closeAll();
    await signOut(auth);
    navigate('/login', { replace: true });
  };

  const showDemoRole =
    import.meta.env.DEV || import.meta.env.VITE_ENABLE_CHAOS_CONTROLLER === 'true';
  const demoRole =
    typeof localStorage !== 'undefined' ? localStorage.getItem(DEMO_ROLE_STORAGE_KEY) : null;

  return (
    <header className="bg-[#faf9fd] dark:bg-[#1a1b1e] border-b-[1px] border-[#727785] flex justify-between items-center w-full px-6 py-4 h-16 fixed top-0 z-50">
      <div className="text-xl font-black text-[#1a1b1e] dark:text-[#faf9fd] tracking-widest font-['Inter'] uppercase">
        ACCESS
      </div>

      <div ref={wrapRef} className="relative flex items-center gap-2">
        <button
          type="button"
          className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-none border border-transparent text-[#727785] hover:bg-surface-container-high hover:text-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-expanded={accountOpen}
          aria-haspopup="dialog"
          aria-controls="topnav-account-panel"
          aria-label="Account"
          onClick={() => {
            setSettingsOpen(false);
            setAccountOpen((o) => !o);
          }}
        >
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt=""
              className="h-9 w-9 border border-outline-variant object-cover"
            />
          ) : (
            <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 0" }} aria-hidden>
              account_circle
            </span>
          )}
        </button>

        <button
          type="button"
          className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-none border border-transparent text-[#727785] hover:bg-surface-container-high hover:text-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-expanded={settingsOpen}
          aria-haspopup="dialog"
          aria-controls="topnav-settings-panel"
          aria-label="Settings"
          onClick={() => {
            setAccountOpen(false);
            setSettingsOpen((o) => !o);
          }}
        >
          <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 0" }} aria-hidden>
            settings
          </span>
        </button>

        {accountOpen && (
          <div
            id="topnav-account-panel"
            role="dialog"
            aria-label="Account"
            className="absolute right-0 top-full z-[60] mt-2 w-[min(100vw-2rem,22rem)] border-2 border-outline bg-surface p-4 shadow-none"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-outline mb-3">Signed in</p>
            {loading && !user ? (
              <p className="text-sm text-on-surface-variant">Loading session…</p>
            ) : user ? (
              <>
                <p className="text-sm font-bold text-on-surface break-all">{user.email ?? 'No email on file'}</p>
                <p className="mt-2 text-[10px] text-on-surface-variant">
                  Internal Firebase user ID is hidden in the UI for privacy (support can look it up in Console).
                </p>
                <dl className="mt-3 space-y-1 text-xs">
                  <div className="flex justify-between gap-2">
                    <dt className="text-outline uppercase tracking-wider">Access role</dt>
                    <dd className="font-bold text-on-surface">{role}</dd>
                  </div>
                  {claimsRole !== role && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-outline uppercase tracking-wider">Token role</dt>
                      <dd className="font-bold text-on-surface">{claimsRole}</dd>
                    </div>
                  )}
                  {staffGates.length > 0 && (
                    <div className="pt-1">
                      <dt className="text-outline uppercase tracking-wider">Staff gates</dt>
                      <dd className="mt-1 font-mono text-on-surface">{staffGates.join(', ')}</dd>
                    </div>
                  )}
                </dl>
                {showDemoRole && demoRole && (
                  <p className="mt-3 text-[10px] text-primary border-t border-outline-variant pt-2">
                    Demo role override: <strong>{demoRole}</strong> (local only)
                  </p>
                )}
                <div className="mt-4 border-t border-outline-variant pt-4">
                  <StarkButton variant="secondary" fullWidth onClick={() => void onSignOut()} icon="logout">
                    Sign out
                  </StarkButton>
                </div>
              </>
            ) : (
              <p className="text-sm text-on-surface-variant">Not signed in.</p>
            )}
          </div>
        )}

        {settingsOpen && (
          <div
            id="topnav-settings-panel"
            role="dialog"
            aria-label="Settings"
            className="absolute right-0 top-full z-[60] mt-2 w-[min(100vw-2rem,22rem)] max-h-[70vh] overflow-y-auto border-2 border-outline bg-surface p-4 shadow-none"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-outline mb-3">App</p>
            <ul className="space-y-3 text-xs text-on-surface">
              <li>
                <span className="font-bold">Version</span> {APP_VERSION} ({import.meta.env.MODE})
              </li>
              <li className="text-on-surface-variant leading-relaxed">
                Live gate and policy data sync through Firestore when you are online. The footer shows sync status.
              </li>
              <li className="text-on-surface-variant leading-relaxed">
                Push alerts use FCM when your project is configured (web push key + service worker).
              </li>
              <li className="text-on-surface-variant leading-relaxed">
                The UI follows your OS <strong>reduced motion</strong> preference where supported.
              </li>
            </ul>

            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-outline mb-2">Help</p>
            <Link
              to="/concierge"
              className="block text-xs font-bold uppercase tracking-widest text-primary border-b-2 border-primary pb-1 hover:text-on-surface hover:border-on-surface"
              onClick={closeAll}
            >
              Venue concierge →
            </Link>

            <p className="mt-4 text-[10px] text-outline leading-relaxed">
              Account actions (sign out, identity) live under the person icon — not here.
            </p>
          </div>
        )}
      </div>
    </header>
  );
};
