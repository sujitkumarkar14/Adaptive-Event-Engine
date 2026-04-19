import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { EntryProvider, useEntryStore } from './store/entryStore';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TopNavBar, SideNavBar, BottomNav, DataFreshnessFooter } from './components/common/Navigation';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAppOrchestration } from './hooks/useAppOrchestration';

const Login = React.lazy(() => import('./pages/Login'));
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
    return <Navigate to="/onboarding" replace />;
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
  return <Navigate to={user ? '/onboarding' : '/login'} replace />;
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
                  <Vouchers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/concierge"
              element={
                <ProtectedRoute>
                  <Concierge />
                </ProtectedRoute>
              }
            />
            <Route
              path="/command/traffic"
              element={
                <ProtectedRoute>
                  <TrafficMatrix />
                </ProtectedRoute>
              }
            />
            <Route
              path="/command/aero"
              element={
                <ProtectedRoute>
                  <AeroMetric />
                </ProtectedRoute>
              }
            />
            <Route
              path="/command/gates"
              element={
                <ProtectedRoute>
                  <GateSupervisor />
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
    <EntryProvider>
      <AuthProvider>
        <Router>
          <AppShell />
        </Router>
      </AuthProvider>
    </EntryProvider>
  );
}

export default App;
