import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { onAuthStateChanged, onIdTokenChanged, User } from 'firebase/auth';
import { auth } from '../lib/firebase';

export type AppRole = 'user' | 'staff' | 'admin' | 'vip';

/** Dev/demo: override Firebase custom claims without Admin SDK. */
export const DEMO_ROLE_STORAGE_KEY = '__demo_role_override';

type ClaimsShape = {
  role?: string;
  staffGates?: unknown;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  /** Effective role after demo override (defaults to `user`). */
  role: AppRole;
  /** Gate IDs from custom claims `staffGates`, or demo defaults when mock-staff. */
  staffGates: string[];
  /** Role from Firebase token only (before demo override). */
  claimsRole: AppRole;
  hasRole: (requiredRole: string) => boolean;
  /** Re-read token + demo override (e.g. after clearing demo role). */
  refreshRole: () => Promise<void>;
};

const defaultContext: AuthContextValue = {
  user: null,
  loading: true,
  role: 'user',
  staffGates: [],
  claimsRole: 'user',
  hasRole: () => false,
  refreshRole: async () => undefined,
};

const AuthContext = createContext<AuthContextValue>(defaultContext);

function parseStaffGates(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((g): g is string => typeof g === 'string' && g.length > 0);
}

function parseClaimsRole(claims: ClaimsShape): AppRole {
  const r = claims.role;
  if (r === 'admin' || r === 'staff' || r === 'user' || r === 'vip') return r;
  return 'user';
}

function readDemoOverride(): AppRole | null {
  if (typeof localStorage === 'undefined') return null;
  const v = localStorage.getItem(DEMO_ROLE_STORAGE_KEY);
  if (v === 'admin' || v === 'staff' || v === 'user' || v === 'vip') return v;
  return null;
}

/** Admin may access staff-only surfaces; staff may not access admin-only if we add later. */
export function roleAllowedForRoute(effectiveRole: AppRole, allowedRoles: AppRole[]): boolean {
  if (allowedRoles.includes(effectiveRole)) return true;
  if (allowedRoles.includes('staff') && effectiveRole === 'admin') return true;
  return false;
}

export function buildHasRole(effectiveRole: AppRole): (requiredRole: string) => boolean {
  return (requiredRole: string) => {
    if (requiredRole === 'user') return true;
    if (requiredRole === 'vip') return effectiveRole === 'vip';
    if (requiredRole === 'staff') return effectiveRole === 'staff' || effectiveRole === 'admin';
    if (requiredRole === 'admin') return effectiveRole === 'admin';
    return false;
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimsRole, setClaimsRole] = useState<AppRole>('user');
  const [staffGatesFromClaims, setStaffGatesFromClaims] = useState<string[]>([]);
  const [demoVersion, setDemoVersion] = useState(0);

  const applyToken = useCallback(async (u: User | null) => {
    if (!u) {
      setClaimsRole('user');
      setStaffGatesFromClaims([]);
      return;
    }
    try {
      const token = await u.getIdTokenResult();
      const c = token.claims as ClaimsShape;
      setClaimsRole(parseClaimsRole(c));
      setStaffGatesFromClaims(parseStaffGates(c.staffGates));
    } catch {
      setClaimsRole('user');
      setStaffGatesFromClaims([]);
    }
  }, []);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setClaimsRole('user');
        setStaffGatesFromClaims([]);
        setLoading(false);
      }
    });
    const unsubToken = onIdTokenChanged(auth, (u) => {
      void applyToken(u);
    });
    return () => {
      unsubAuth();
      unsubToken();
    };
  }, [applyToken]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    void applyToken(user).finally(() => setLoading(false));
  }, [user, applyToken]);

  useEffect(() => {
    const bump = () => setDemoVersion((v) => v + 1);
    window.addEventListener('demo-role-changed', bump);
    window.addEventListener('storage', bump);
    return () => {
      window.removeEventListener('demo-role-changed', bump);
      window.removeEventListener('storage', bump);
    };
  }, []);

  const { role, staffGates } = useMemo(() => {
    const demo = import.meta.env.DEV || import.meta.env.VITE_ENABLE_CHAOS_CONTROLLER === 'true'
      ? readDemoOverride()
      : null;
    if (demo === 'admin') {
      return { role: 'admin' as AppRole, staffGates: staffGatesFromClaims.length ? staffGatesFromClaims : ['GATE_A', 'GATE_B'] };
    }
    if (demo === 'staff') {
      return {
        role: 'staff' as AppRole,
        staffGates: staffGatesFromClaims.length ? staffGatesFromClaims : ['GATE_B'],
      };
    }
    if (demo === 'user') {
      return { role: 'user' as AppRole, staffGates: [] };
    }
    if (demo === 'vip') {
      return { role: 'vip' as AppRole, staffGates: [] };
    }
    return {
      role: claimsRole,
      staffGates: claimsRole === 'staff' || claimsRole === 'admin' ? staffGatesFromClaims : [],
    };
  }, [claimsRole, staffGatesFromClaims, demoVersion]);

  const hasRole = useMemo(() => buildHasRole(role), [role]);

  const refreshRole = useCallback(async () => {
    if (user) await applyToken(user);
    setDemoVersion((v) => v + 1);
  }, [user, applyToken]);

  const value = useMemo(
    () => ({
      user,
      loading,
      role,
      staffGates,
      claimsRole,
      hasRole,
      refreshRole,
    }),
    [user, loading, role, staffGates, claimsRole, hasRole, refreshRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
