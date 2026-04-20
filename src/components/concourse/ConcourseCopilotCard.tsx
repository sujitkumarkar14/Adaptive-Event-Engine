import React, { useEffect, useState } from 'react';
import { StarkCard, StarkButton } from '../common/StarkComponents';
import { fetchConcourseCopilotTip } from '../../lib/maps';
import { useEntryStore } from '../../store/entryStore';
import { translateAlertText, type AlertLang } from '../../services/translationClient';

const DEFAULT_LAT = 33.9538;
const DEFAULT_LNG = -118.3384;

const LANG_LABEL: Record<AlertLang, string> = {
  en: 'English',
  hi: 'हिन्दी',
  te: 'తెలుగు',
};

/**
 * Places-backed concourse hint + simulated occupancy; optional Distance Matrix insight; translation for demo locales.
 */
export const ConcourseCopilotCard = ({
  liveOccupancyPercent,
  matrixInsight,
  alertLang,
  onAlertLangChange,
  onExitOptimization,
  exitOptimizationBusy,
}: {
  liveOccupancyPercent?: number | null;
  matrixInsight?: string | null;
  alertLang: AlertLang;
  onAlertLangChange: (lang: AlertLang) => void;
  onExitOptimization?: () => void;
  exitOptimizationBusy?: boolean;
}) => {
  const { state } = useEntryStore();
  const [tip, setTip] = useState<string | null>(null);
  const [displayTip, setDisplayTip] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const wheelchair = state.accessibility.stepFree || state.stepFreeRequired;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);
    void fetchConcourseCopilotTip({
      latitude: DEFAULT_LAT,
      longitude: DEFAULT_LNG,
      wheelchairAccessibleOnly: wheelchair,
    })
      .then((res) => {
        if (cancelled) return;
        let text = res.tip;
        if (typeof liveOccupancyPercent === 'number' && Number.isFinite(liveOccupancyPercent)) {
          text += ` Live gate signal: ~${Math.round(liveOccupancyPercent)}% pressure.`;
        }
        setTip(text);
      })
      .catch(() => {
        if (cancelled) return;
        const offline = typeof navigator !== 'undefined' && !navigator.onLine;
        setErr(
          offline
            ? 'Venue tips need a network connection. Reconnect to load nearby places.'
            : 'Venue tips are temporarily unavailable. Follow section signage; we’ll retry when the service responds.'
        );
        setTip(
          'Smart tip: Use section signage for the nearest restroom — full concierge tips return when Places responds.'
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [wheelchair, liveOccupancyPercent]);

  useEffect(() => {
    let cancelled = false;
    if (!tip) {
      setDisplayTip(null);
      return;
    }
    if (alertLang === 'en') {
      setDisplayTip(tip);
      return;
    }
    void translateAlertText(tip, alertLang).then((out) => {
      if (!cancelled) setDisplayTip(out);
    });
    return () => {
      cancelled = true;
    };
  }, [tip, alertLang]);

  const matrixLine = matrixInsight?.trim() ?? '';

  return (
    <StarkCard title="Concourse copilot" subtitle="Places + Matrix ETAs + alerts" className="border-2 border-black">
      <div className="mt-4 flex flex-wrap gap-2 items-center border border-outline p-2 bg-surface-container-highest">
        <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Translation</span>
        {(['en', 'hi', 'te'] as const).map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => onAlertLangChange(code)}
            className={`px-3 py-1 text-xs font-black uppercase tracking-widest border-2 border-black rounded-none ${
              alertLang === code ? 'bg-black text-white' : 'bg-surface-container-high text-on-surface'
            }`}
            aria-pressed={alertLang === code}
          >
            {LANG_LABEL[code]}
          </button>
        ))}
      </div>

      {matrixLine ? (
        <p
          role="status"
          aria-live="polite"
          className="mt-3 text-xs font-black uppercase tracking-widest border border-black px-3 py-2 bg-primary-fixed text-on-primary-fixed"
        >
          {matrixLine}
        </p>
      ) : null}

      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="mt-4 text-sm font-bold text-on-surface uppercase tracking-widest leading-relaxed"
      >
        {loading ? 'Loading venue intelligence…' : null}
        {!loading && err ? <span className="text-error block mb-2">{err}</span> : null}
        {!loading && (displayTip ?? tip) ? (
          <span className={err ? 'text-on-surface' : undefined}>{displayTip ?? tip}</span>
        ) : null}
      </div>

      {onExitOptimization ? (
        <StarkButton
          type="button"
          variant="primary"
          fullWidth
          className="mt-6 min-h-[48px] text-xs font-black uppercase tracking-widest border-2 border-black bg-black text-white hover:bg-on-surface-variant rounded-none"
          onClick={onExitOptimization}
          disabled={Boolean(exitOptimizationBusy)}
          aria-busy={exitOptimizationBusy ?? false}
        >
          {exitOptimizationBusy ? 'Computing exit path…' : 'Exit optimization'}
        </StarkButton>
      ) : null}
    </StarkCard>
  );
};
