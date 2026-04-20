import React, { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { StarkButton, StarkInput } from '../components/common/StarkComponents';
import { getLoginAuthErrorMessage } from '../lib/errors';
import { useEntryStore } from '../store/entryStore';
import { writeDemoSession } from '../lib/demoSession';
import { DEFAULT_DEMO_EVENT_ID } from '../lib/demoConstants';

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

/** Minimum bar: 8+ chars with at least one letter and one digit (client-side hint; Firebase enforces server-side). */
function isStrongEnoughPassword(s: string): boolean {
  return s.length >= 8 && /[A-Za-z]/.test(s) && /\d/.test(s);
}

export const Login = () => {
  const navigate = useNavigate();
  const { dispatch } = useEntryStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goOnboarding = () => navigate('/onboarding', { replace: true });

  const handleDemoAccess = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInAnonymously(auth);
      writeDemoSession(DEFAULT_DEMO_EVENT_ID);
      dispatch({
        type: 'SET_DEMO_CONTEXT',
        payload: { demoMode: true, demoEventId: DEFAULT_DEMO_EVENT_ID },
      });
      navigate('/check-in', { replace: true });
    } catch (e: unknown) {
      setAuthError(e);
    } finally {
      setBusy(false);
    }
  };

  const setAuthError = (e: unknown) => {
    const msg = getLoginAuthErrorMessage(e);
    if (import.meta.env.DEV && import.meta.env.MODE !== 'test') {
      // eslint-disable-next-line no-console -- dev-only diagnostics for Firebase Auth / App Check setup
      console.warn('[Login] Auth error', e);
    }
    if (
      import.meta.env.DEV &&
      import.meta.env.MODE !== 'test' &&
      e &&
      typeof e === 'object' &&
      'code' in e &&
      typeof (e as { code: string }).code === 'string'
    ) {
      setError(`${msg} (${(e as { code: string }).code})`);
      return;
    }
    setError(msg);
  };

  const handleEmailSignIn = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      goOnboarding();
    } catch (e: unknown) {
      setAuthError(e);
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async () => {
    setError(null);
    if (!email.trim() || !password || !confirmPassword) {
      setError('Email, password, and confirm password are required to create an account.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!isStrongEnoughPassword(password)) {
      setError('Use at least 8 characters including both letters and numbers.');
      return;
    }
    setBusy(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      goOnboarding();
    } catch (e: unknown) {
      setAuthError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      className="flex flex-col justify-center min-h-full max-w-md mx-auto px-4 py-12"
      aria-labelledby="login-heading"
    >
      <h1 id="login-heading" className="text-4xl font-black tracking-tighter uppercase mb-2">
        Identity Gate
      </h1>
      <p className="text-on-surface-variant font-bold text-xs tracking-widest uppercase mb-10">
        Secure access to booking, your event pass, and venue updates
      </p>

      <form
        className="border-2 border-outline bg-surface-container-lowest p-6 mb-8"
        onSubmit={(e) => e.preventDefault()}
        noValidate
      >
        <div className="space-y-4">
          <StarkInput
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
            aria-invalid={!!error}
            aria-describedby={error ? 'login-error' : undefined}
          />
          <StarkInput
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
            aria-invalid={!!error}
            aria-describedby={error ? 'login-error' : undefined}
          />
          <StarkInput
            label="Confirm password (new accounts only)"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={busy}
            aria-invalid={!!error}
            aria-describedby={error ? 'login-error login-password-hint' : 'login-password-hint'}
          />
          <p id="login-password-hint" className="text-[10px] font-bold text-outline uppercase tracking-wider -mt-2">
            Required when creating an account — at least 8 characters with letters and numbers.
          </p>
          <div className="flex flex-col gap-3">
            <StarkButton fullWidth disabled={busy} onClick={handleEmailSignIn} type="button">
              Sign In
            </StarkButton>
            <StarkButton variant="secondary" fullWidth disabled={busy} onClick={handleRegister} type="button">
              Create Account
            </StarkButton>
            <StarkButton variant="tertiary" fullWidth disabled={busy} onClick={handleDemoAccess} type="button">
              Continue with live demo (scanner first)
            </StarkButton>
          </div>
        </div>
      </form>

      {error && (
        <div
          id="login-error"
          role="alert"
          aria-live="assertive"
          className="border-2 border-error bg-error-container text-on-error-container font-bold text-sm leading-relaxed normal-case tracking-normal p-4"
        >
          {error}
        </div>
      )}
    </section>
  );
};

export default Login;
