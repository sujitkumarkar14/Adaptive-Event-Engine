import { describe, it, expect } from 'vitest';
import { FirebaseError } from 'firebase/app';
import { getHttpsCallableUserMessage, getLoginAuthErrorMessage } from '../errors';

describe('getHttpsCallableUserMessage', () => {
  it('maps known function codes to safe copy', () => {
    expect(
      getHttpsCallableUserMessage(new FirebaseError('functions/unauthenticated', 'x'))
    ).toMatch(/sign in/i);
    expect(
      getHttpsCallableUserMessage(new FirebaseError('functions/permission-denied', 'x'))
    ).toMatch(/permission/i);
    expect(
      getHttpsCallableUserMessage(new FirebaseError('functions/invalid-argument', 'x'))
    ).toMatch(/could not be processed/i);
    expect(
      getHttpsCallableUserMessage(new FirebaseError('functions/failed-precondition', 'x'))
    ).toMatch(/not available for booking/i);
    expect(
      getHttpsCallableUserMessage(new FirebaseError('functions/resource-exhausted', 'x'))
    ).toMatch(/slot|time/i);
    expect(
      getHttpsCallableUserMessage(new FirebaseError('functions/aborted', 'x'))
    ).toMatch(/slot|time/i);
    expect(
      getHttpsCallableUserMessage(new FirebaseError('functions/unavailable', 'x'))
    ).toMatch(/unavailable/i);
    expect(
      getHttpsCallableUserMessage(new FirebaseError('functions/deadline-exceeded', 'x'))
    ).toMatch(/unavailable/i);
    const internalMsg = getHttpsCallableUserMessage(new FirebaseError('functions/internal', 'secret'));
    expect(internalMsg).not.toContain('secret');
    expect(internalMsg).not.toMatch(/spanner|Spanner|\.sql|gateLogistics|firestore|Firestore/i);
    expect(internalMsg).toMatch(/temporarily unavailable for this venue/i);
    expect(getHttpsCallableUserMessage(new FirebaseError('functions/unknown', 'x'))).toMatch(/try again/i);
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
      getLoginAuthErrorMessage(new FirebaseError('auth/missing-app-credential', 'x'))
    ).toMatch(/App Check/i);
    expect(
      getLoginAuthErrorMessage(new FirebaseError('auth/internal', 'AppCheck token invalid'))
    ).toMatch(/App Check/i);
    expect(
      getLoginAuthErrorMessage(new FirebaseError('auth/internal', 'app check failed'))
    ).toMatch(/App Check/i);
  });

  it('maps common auth codes without exposing internals', () => {
    expect(getLoginAuthErrorMessage(new FirebaseError('auth/wrong-password', 'x'))).toMatch(/sign-in/i);
    expect(getLoginAuthErrorMessage(new FirebaseError('auth/network-request-failed', 'x'))).toMatch(/network/i);
    expect(getLoginAuthErrorMessage(new FirebaseError('auth/operation-not-allowed', 'x'))).toMatch(/Email\/password|sign-in method/i);
    expect(getLoginAuthErrorMessage(new FirebaseError('auth/unauthorized-domain', 'x'))).toMatch(/Authorized domains/i);
    expect(getLoginAuthErrorMessage(new FirebaseError('auth/invalid-api-key', 'x'))).toMatch(/API key/i);
    expect(getLoginAuthErrorMessage(new FirebaseError('auth/configuration-not-found', 'x'))).toMatch(/Auth is not provisioned/i);
    expect(getLoginAuthErrorMessage(new FirebaseError('auth/invalid-auth-event', 'x'))).toMatch(/provisioned/i);
    expect(getLoginAuthErrorMessage(new FirebaseError('auth/invalid-email', 'x'))).toMatch(/valid email/i);
    expect(getLoginAuthErrorMessage(new FirebaseError('auth/user-disabled', 'x'))).toMatch(/disabled/i);
    expect(getLoginAuthErrorMessage(new FirebaseError('auth/user-not-found', 'x'))).toMatch(/sign-in failed/i);
    expect(getLoginAuthErrorMessage(new FirebaseError('auth/invalid-credential', 'x'))).toMatch(/sign-in failed/i);
    expect(getLoginAuthErrorMessage(new FirebaseError('auth/email-already-in-use', 'x'))).toMatch(/already registered/i);
    expect(getLoginAuthErrorMessage(new FirebaseError('auth/weak-password', 'x'))).toMatch(/stronger password/i);
    expect(getLoginAuthErrorMessage(new FirebaseError('auth/too-many-requests', 'x'))).toMatch(/Wait and try/i);
    expect(getLoginAuthErrorMessage(new FirebaseError('auth/popup-blocked', 'x'))).toMatch(/popup/i);
    expect(getLoginAuthErrorMessage(new FirebaseError('auth/popup-closed-by-user', 'x'))).toMatch(/popup/i);
    expect(getLoginAuthErrorMessage(new FirebaseError('auth/cancelled-popup-request', 'x'))).toMatch(/already in progress/i);
    expect(getLoginAuthErrorMessage(new FirebaseError('auth/unknown-code', 'x'))).toMatch(/could not be completed/i);
    expect(getLoginAuthErrorMessage(new FirebaseError('auth/unknown-code', 'x'))).toMatch(/unknown-code/);
    expect(getLoginAuthErrorMessage(new FirebaseError('auth/internal-error', 'x'))).toMatch(/Anonymous|Identity Toolkit/i);
    expect(getLoginAuthErrorMessage(new FirebaseError('auth/web-storage-unsupported', 'x'))).toMatch(/storage/i);
  });

  it('returns generic copy for non-Firebase errors', () => {
    expect(getLoginAuthErrorMessage(new Error('random'))).toMatch(/could not be completed/i);
  });
});
