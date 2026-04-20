import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { EntryProvider, useEntryStore } from './store/entryStore';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TopNavBar, SideNavBar, BottomNav, DataFreshnessFooter } from './components/navigation/Navigation';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleRoute } from './components/RoleRoute';
import { useAppOrchestration } from './hooks/useAppOrchestration';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { PageErrorBoundary } from './components/PageErrorBoundary';
import { TtsFallbackNotice } from './components/TtsFallbackNotice';
import { readDemoSession } from './lib/demoSession';

const Login = React.lazy(() => import('./pages/Login'));
const CheckIn = React.lazy(() => import('./pages/CheckIn'));
const Onboarding = React.lazy(() => import('./pages/Onboarding'));
const Booking = React.lazy(() => import('./pages/Booking'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Vouchers = React.lazy(() => import('./pages/Vouchers'));
const Concierge = React.lazy(() => import('./pages/Concierge'));
const TrafficMatrix = React.lazy(() =>
  import('./pages/CommandDashboards').then((module) => ({ default: module.TrafficCommand }))
);
const AeroMetric = React.lazy(() =>
  import('./pages/CommandDashboards').then((module) => ({ default: module.AeroCommand }))
);
const GateSupervisor = React.lazy(() =>
  import('./pages/CommandDashboards').then((module) => ({ default: module.GateCommand }))
);
const StaffDashboard = React.lazy(() => import('./pages/StaffDashboard'));
const Unauthorized = React.lazy(() => import('./pages/Unauthorized'));

function LoginRoute() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center font-black animate-pulse text-outline uppercase tracking-widest">
        Initializing…
      </div>
    );
  }
  if (user) {
    const demo = readDemoSession();
    return <Navigate to={demo.demoMode ? '/check-in' : '/onboarding'} replace />;
  }
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center font-black animate-pulse text-outline uppercase tracking-widest">
          Loading sign-in…
        </div>
      }
    >
      <Login />
    </Suspense>
  );
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center font-black animate-pulse text-outline uppercase tracking-widest">
        Initializing…
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  const demo = readDemoSession();
  return <Navigate to={demo.demoMode ? '/check-in' : '/onboarding'} replace />;
}

function AppShell() {
  const { state } = useEntryStore();
  const { user } = useAuth();
  const location = useLocation();
  const isLogin = location.pathname === '/login';

  useAppOrchestration(user);

  const globalClass = state.phase === 'EMERGENCY' ? 'border-8 border-error animate-pulse' : '';

  return (
    <div className={`flex bg-[#ffffff] min-h-screen font-body text-on-surface ${globalClass}`}>
      <TtsFallbackNotice />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-inverse-surface focus:text-inverse-on-surface focus:font-black focus:uppercase focus:tracking-widest top-0 left-0"
      >
        Skip to primary content
      </a>

      {!isLogin && <TopNavBar />}
      {!isLogin && <SideNavBar />}

      <main
        id="main-content"
        className="flex-1 md:ml-72 pb-20 md:pb-12 pt-16 relative overflow-y-auto w-full max-w-full px-4 md:px-8"
      >
        <Suspense
          fallback={
            <div className="h-full flex items-center justify-center font-black animate-pulse text-outline uppercase tracking-widest">
              Initializing link…
            </div>
          }
        >
          <Routes>
            <Route path="/login" element={<LoginRoute />} />
            <Route path="/" element={<RootRedirect />} />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />
            <Route
              path="/booking"
              element={
                <ProtectedRoute>
                  <Booking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vouchers"
              element={
                <ProtectedRoute>
                  <PageErrorBoundary>
                    <Vouchers />
                  </PageErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/concierge"
              element={
                <ProtectedRoute>
                  <PageErrorBoundary>
                    <Concierge />
                  </PageErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/check-in"
              element={
                <ProtectedRoute>
                  <PageErrorBoundary>
                    <CheckIn />
                  </PageErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff"
              element={
                <RoleRoute allowedRoles={['staff', 'admin']}>
                  <StaffDashboard />
                </RoleRoute>
              }
            />
            <Route
              path="/command/traffic"
              element={
                <RoleRoute allowedRoles={['staff', 'admin']}>
                  <TrafficMatrix />
                </RoleRoute>
              }
            />
            <Route
              path="/command/aero"
              element={
                <RoleRoute allowedRoles={['staff', 'admin']}>
                  <AeroMetric />
                </RoleRoute>
              }
            />
            <Route
              path="/command/gates"
              element={
                <RoleRoute allowedRoles={['staff', 'admin']}>
                  <GateSupervisor />
                </RoleRoute>
              }
            />
            <Route
              path="/unauthorized"
              element={
                <ProtectedRoute>
                  <Unauthorized />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </main>

      {!isLogin && <BottomNav />}
      {!isLogin && <DataFreshnessFooter />}
    </div>
  );
}

function App() {
  return (
    <AppErrorBoundary>
      <EntryProvider>
        <AuthProvider>
          <Router>
            <AppShell />
          </Router>
        </AuthProvider>
      </EntryProvider>
    </AppErrorBoundary>
  );
}

export default App;
