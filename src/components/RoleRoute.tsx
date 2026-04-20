import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AppRole, roleAllowedForRoute, useAuth } from '../contexts/AuthContext';

function RoleGuard({
  allowedRoles,
  fallbackTo,
  children,
}: {
  allowedRoles: AppRole[];
  fallbackTo: 'unauthorized' | 'dashboard';
  children: ReactNode;
}) {
  const { role } = useAuth();
  if (!roleAllowedForRoute(role, allowedRoles)) {
    return <Navigate to={fallbackTo === 'dashboard' ? '/dashboard' : '/unauthorized'} replace />;
  }
  return <>{children}</>;
}

/**
 * Authenticated route that requires one of `allowedRoles` (`admin` may access `staff`-listed routes).
 */
export function RoleRoute({
  children,
  allowedRoles,
  fallbackTo = 'unauthorized',
}: {
  children: ReactNode;
  allowedRoles: AppRole[];
  fallbackTo?: 'unauthorized' | 'dashboard';
}) {
  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={allowedRoles} fallbackTo={fallbackTo}>
        {children}
      </RoleGuard>
    </ProtectedRoute>
  );
}
