import React, { useState } from 'react';
import {
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { StarkButton, StarkInput } from '../components/common/StarkComponents';
import { getLoginAuthErrorMessage } from '../lib/errors';

export const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goOnboarding = () => navigate('/onboarding', { replace: true });

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

  const handleAnonymous = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInAnonymously(auth);
      goOnboarding();
    } catch (e: unknown) {
      setAuthError(e);
    } finally {
      setBusy(false);
    }
  };

  const handleEmailSignIn = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Email and password are required.');
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
    if (!email.trim() || !password) {
      setError('Email and password are required.');
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
        Required for secured booking and Spanner transactions
      </p>

      <div className="border-2 border-outline bg-surface-container-lowest p-6 mb-8">
        <StarkButton
          fullWidth
          disabled={busy}
          onClick={handleAnonymous}
          className="mb-6"
          aria-label="Continue as guest with anonymous sign-in"
        >
          Continue as Guest
        </StarkButton>

        <div className="border-t border-outline-variant pt-6 space-y-4">
          <StarkInput
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
          />
          <StarkInput
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
          />
          <div className="flex flex-col gap-3">
            <StarkButton fullWidth disabled={busy} onClick={handleEmailSignIn}>
              Sign In
            </StarkButton>
            <StarkButton variant="secondary" fullWidth disabled={busy} onClick={handleRegister}>
              Create Account
            </StarkButton>
          </div>
        </div>
      </div>

      {error && (
        <div
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
