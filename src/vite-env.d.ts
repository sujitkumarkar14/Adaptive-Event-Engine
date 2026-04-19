/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_FIREBASE_FUNCTIONS_REGION?: string;
  readonly VITE_REMOTE_CONFIG_MIN_FETCH_MS?: string;
  readonly VITE_USE_ROUTING_MOCK?: string;
  /** Base URL for Maps Datasets (or compatible) venue polygon API; omit to use Stitch SVG + local GeoJSON fallback. */
  readonly VITE_MAPS_DATASETS_URL?: string;
  /** Set `"true"` to show Dashboard chaos simulator in production builds (default: hidden). */
  readonly VITE_ENABLE_CHAOS_CONTROLLER?: string;
  /** reCAPTCHA site key for Firebase App Check (omit in dev/CI to skip App Check). */
  readonly VITE_RECAPTCHA_SITE_KEY?: string;
  /** Set `"true"` to use ReCaptchaEnterpriseProvider; otherwise ReCaptchaV3Provider (local / staging). */
  readonly VITE_APP_CHECK_USE_ENTERPRISE?: string;
  /** Optional label for humans only (e.g. `staging` | `production`); not read by App Check logic. */
  readonly VITE_APP_ENVIRONMENT?: string;
  /** Set `"true"` to skip Firebase App Check initialization (recommended for localhost if Auth fails with App Check / reCAPTCHA). */
  readonly VITE_DISABLE_APP_CHECK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
