import { describe, it, expect } from 'vitest';
import { FirebaseError } from 'firebase/app';
import { getHttpsCallableUserMessage, getLoginAuthErrorMessage } from '../errors';

describe('getHttpsCallableUserMessage', () => {
  it('maps known function codes to safe copy', () => {
    expect(
      getHttpsCallableUserMessage(new FirebaseError('functions/unauthenticated', 'x'))
    ).toMatch(/sign in/i);
    expect(
      getHttpsCallableUserMessage(new FirebaseError('functions/resource-exhausted', 'x'))
    ).toMatch(/slot|time/i);
    expect(getHttpsCallableUserMessage(new FirebaseError('functions/internal', 'secret'))).not.toContain('secret');
  });

  it('returns generic copy for unknown errors', () => {
    expect(getHttpsCallableUserMessage(new Error('stack trace here'))).toMatch(/try again/i);
  });
});

describe('getLoginAuthErrorMessage', () => {
  it('maps App Check related failures', () => {
    expect(
      getLoginAuthErrorMessage(new FirebaseError('auth/invalid-app-credential', 'x'))
    ).toMatch(/App Check/i);
    expect(
      getLoginAuthErrorMessage(new FirebaseError('auth/internal', 'AppCheck token invalid'))
    ).toMatch(/App Check/i);
  });

  it('maps common auth codes without exposing internals', () => {
    expect(getLoginAuthErrorMessage(new FirebaseError('auth/wrong-password', 'x'))).toMatch(/sign-in/i);
    expect(getLoginAuthErrorMessage(new FirebaseError('auth/network-request-failed', 'x'))).toMatch(/network/i);
    expect(getLoginAuthErrorMessage(new FirebaseError('auth/operation-not-allowed', 'x'))).toMatch(/Email\/password/i);
    expect(getLoginAuthErrorMessage(new FirebaseError('auth/unauthorized-domain', 'x'))).toMatch(/Authorized domains/i);
  });
});
