/**
 * Firebase Web `apiKey` is public by design (embedded in client JS and sent on API calls). It is not a secret.
 * Lock down access with Google Cloud API key restrictions (HTTP referrers), Firestore/Storage rules, and optional App Check.
 * @see https://firebase.google.com/docs/projects/api-keys
 */
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  enableIndexedDbPersistence
} from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getRemoteConfig, fetchAndActivate, getValue } from "firebase/remote-config";
import { initializeAppCheck, ReCaptchaEnterpriseProvider, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSy_mock_key_update_later",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "adaptive-entry.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "adaptive-entry",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "adaptive-entry.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:123456789:web:abcdef",
};

const functionsRegion = import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION ?? "us-central1";
const remoteConfigMinFetch = Number(import.meta.env.VITE_REMOTE_CONFIG_MIN_FETCH_MS ?? 3600000);

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, functionsRegion);
export const remoteConfig = getRemoteConfig(app);

const isTestEnv = import.meta.env.MODE === "test";

/**
 * App Check / reCAPTCHA site keys are **per Firebase web app** in the Firebase console.
 * Use different `.env` files per deploy target (e.g. staging vs production CI) so each build
 * embeds the correct `VITE_RECAPTCHA_SITE_KEY` and `VITE_FIREBASE_*` values for that project.
 * `VITE_APP_CHECK_USE_ENTERPRISE`: Enterprise reCAPTCHA in prod/staging; omit or `false` for V3 (local dev).
 */
const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
/** Local/dev: set `VITE_DISABLE_APP_CHECK=true` so App Check + reCAPTCHA do not block Auth on localhost when `.env` still contains a site key. */
const appCheckDisabled = import.meta.env.VITE_DISABLE_APP_CHECK === "true";

if (
  !isTestEnv &&
  !appCheckDisabled &&
  typeof recaptchaSiteKey === "string" &&
  recaptchaSiteKey.length > 0
) {
  const useEnterprise = import.meta.env.VITE_APP_CHECK_USE_ENTERPRISE === "true";
  const provider = useEnterprise
    ? new ReCaptchaEnterpriseProvider(recaptchaSiteKey)
    : new ReCaptchaV3Provider(recaptchaSiteKey);
  initializeAppCheck(app, {
    provider,
    isTokenAutoRefreshEnabled: true,
  });
}

// Remote Config Policy Toggles (Hot Path)
remoteConfig.settings.minimumFetchIntervalMillis = Number.isFinite(remoteConfigMinFetch)
  ? remoteConfigMinFetch
  : 3600000;
remoteConfig.defaultConfig = {
  gate_2_status: "OPEN",
  gate_reroute_active: "false"
};

export const initRemoteConfig = async () => {
    try {
        await fetchAndActivate(remoteConfig);
        return getValue(remoteConfig, "gate_2_status").asString();
    } catch(err) {
        console.warn("Offline: Using fallback Remote Config states.");
        return "OPEN";
    }
}

// STRICT OFFLINE PERSISTENCE
// The core resilience constraint: we must handle 0kbps seamlessly.
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a a time.
      console.warn("Firestore offline persistence failed precondition.");
    } else if (err.code == 'unimplemented') {
      // The current browser does not support all of the features required to enable persistence
      console.warn("Firestore offline persistence is not supported by this browser.");
    }
  });

export default app;
