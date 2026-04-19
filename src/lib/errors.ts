import { FirebaseError } from 'firebase/app';

/**
 * Maps Firebase Callable / HTTPS errors to user-safe strings (no stack traces or backend internals).
 */
export function getHttpsCallableUserMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'functions/unauthenticated':
        return 'Sign in to continue.';
      case 'functions/permission-denied':
        return 'You do not have permission for this action.';
      case 'functions/invalid-argument':
        return 'That request could not be processed.';
      case 'functions/resource-exhausted':
      case 'functions/aborted':
        return 'This slot is no longer available. Choose another time.';
      case 'functions/unavailable':
      case 'functions/deadline-exceeded':
        return 'Service is temporarily unavailable. Try again shortly.';
      case 'functions/internal':
      case 'functions/unknown':
      default:
        return 'Something went wrong. Please try again.';
    }
  }
  return 'Something went wrong. Please try again.';
}

/**
 * Maps Firebase Auth / App Check failures to user-safe copy for the Identity Gate (Login).
 * Covers App Check token failures and common auth/* codes.
 */
export function getLoginAuthErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    const code = error.code;
    if (
      code === 'auth/invalid-app-credential' ||
      code === 'auth/missing-app-credential' ||
      /app-check|AppCheck|app check/i.test(error.message)
    ) {
      return 'Identity verification failed (App Check). On localhost, add VITE_DISABLE_APP_CHECK=true to .env or fix reCAPTCHA / Firebase App Check settings.';
    }
    switch (code) {
      case 'auth/operation-not-allowed':
        return 'Email/password sign-in is disabled for this Firebase project. Enable it in Firebase Console → Authentication → Sign-in method.';
      case 'auth/unauthorized-domain':
        return 'This origin is not allowed. Add localhost (and your port) under Firebase Console → Authentication → Settings → Authorized domains.';
      case 'auth/invalid-api-key':
        return 'Invalid web API key. Copy the Web API key from Firebase Console → Project settings → Your apps into VITE_FIREBASE_API_KEY in .env.';
      case 'auth/configuration-not-found':
      case 'auth/invalid-auth-event':
        return 'Auth is not provisioned for this Firebase project, or the Web config does not match it. In Firebase Console → Authentication, open the section and use Get started if shown, then enable Email/Password. Copy the full Web app config from Project settings → General (same apiKey, appId, projectId as in .env). In Google Cloud (same project), enable Identity Toolkit API. If it persists, create a new Web app in Firebase and replace all VITE_FIREBASE_* values, then rebuild.';
      case 'auth/invalid-email':
        return 'Enter a valid email address.';
      case 'auth/user-disabled':
        return 'This account is disabled.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Sign-in failed. Check your email and password.';
      case 'auth/email-already-in-use':
        return 'That email is already registered. Sign in instead.';
      case 'auth/weak-password':
        return 'Password is too weak. Use a stronger password.';
      case 'auth/network-request-failed':
        return 'Network error. Check connectivity and try again.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Wait and try again.';
      case 'auth/popup-blocked':
      case 'auth/popup-closed-by-user':
        return 'Sign-in popup was blocked or closed. Allow popups for this site or try again.';
      case 'auth/cancelled-popup-request':
        return 'Another sign-in is already in progress.';
      default:
        return 'Sign-in could not be completed. Try again.';
    }
  }
  return 'Sign-in could not be completed. Try again.';
}
