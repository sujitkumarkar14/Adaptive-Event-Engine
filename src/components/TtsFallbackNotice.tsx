import { useTranslation } from '../hooks/useTranslation';

export function TtsFallbackNotice() {
  const { ttsSupported } = useTranslation();
  if (ttsSupported) return null;
  return (
    <p
      role="status"
      aria-live="polite"
      className="sr-only focus:not-sr-only focus:absolute focus:z-40 focus:left-4 focus:bottom-20 focus:max-w-sm focus:p-3 focus:bg-surface-container-high focus:border-2 focus:border-outline focus:text-xs text-on-surface-variant"
    >
      Audio alerts are unavailable in this browser. Please rely on on-screen messages and notifications.
    </p>
  );
}
