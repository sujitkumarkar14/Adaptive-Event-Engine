import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, doc, limit, onSnapshot, query } from 'firebase/firestore';
import { StarkCard, StarkButton } from '../components/common/StarkComponents';
import { useAuth } from '../contexts/AuthContext';
import { useEntryStore } from '../store/entryStore';
import { db } from '../lib/firebase';
import {
  DEFAULT_BOOKING_GATE_ID,
  ROUTING_POLICY_COLLECTION,
  ROUTING_POLICY_DOC_ID,
} from '../lib/constants';

type SectorRow = { id: string; densityPercent: number | null; label: string };

function readDensity(data: Record<string, unknown> | undefined): number | null {
  if (!data) return null;
  const p =
    typeof data.pressurePercent === 'number'
      ? data.pressurePercent
      : typeof data.currentPressure === 'number'
        ? data.currentPressure
        : null;
  if (p == null || !Number.isFinite(p)) return null;
  return Math.round(Math.min(100, Math.max(0, p)));
}

export const TrafficCommand = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const canStaff = hasRole('staff') || hasRole('admin');
  const [sectors, setSectors] = useState<SectorRow[]>([]);
  const [feedReady, setFeedReady] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'gateLogistics'), limit(12));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setFeedReady(true);
        const rows: SectorRow[] = snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          return {
            id: d.id,
            label: d.id,
            densityPercent: readDensity(data),
          };
        });
        setSectors(rows);
      },
      () => {
        setFeedReady(true);
        setSectors([]);
      }
    );
    return () => unsub();
  }, []);

  const subtitle = useMemo(() => {
    if (!feedReady) return 'Loading venue feed…';
    if (sectors.length === 0) return 'No gateLogistics documents yet';
    return 'Live documents from gateLogistics';
  }, [feedReady, sectors.length]);

  return (
    <section className="flex flex-col h-full">
      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tighter uppercase mb-2 text-error">Command Matrix</h1>
        <p className="text-on-surface-variant font-bold text-xs tracking-widest uppercase">{subtitle}</p>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-outline max-w-xl">
          Command simulation / situational overview. Sector density reflects Firestore gateLogistics when present —
          not a separate traffic mesh.
        </p>
      </div>

      <div className="flex-grow space-y-4">
        {!feedReady ? (
          <StarkCard title="Venue feed" subtitle="Connecting…">
            <p className="mt-2 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Loading…</p>
          </StarkCard>
        ) : sectors.length === 0 ? (
          <StarkCard title="No live sectors" subtitle="gateLogistics is empty">
            <p className="mt-2 text-sm font-bold text-on-surface-variant normal-case tracking-normal">
              When the venue pipeline writes gate documents, they appear here automatically.
            </p>
          </StarkCard>
        ) : (
          <>
            {sectors.map((s) => (
              <StarkCard
                key={s.id}
                title={s.label}
                subtitle={s.id === DEFAULT_BOOKING_GATE_ID ? 'Primary gate (default booking)' : 'Gate sector'}
                className={s.densityPercent != null && s.densityPercent >= 80 ? 'border-l-error' : ''}
              >
                <div className="mt-2">
                  <span
                    className={`font-bold ${s.densityPercent != null && s.densityPercent >= 80 ? 'text-error' : 'text-secondary'}`}
                  >
                    {s.densityPercent != null ? `Density: ${s.densityPercent}%` : 'Density: — (no pressure field)'}
                  </span>
                </div>
              </StarkCard>
            ))}
            <div className="flex flex-col items-stretch sm:items-end gap-2 pt-2">
              <StarkButton
                variant="secondary"
                type="button"
                disabled={!canStaff}
                title={
                  canStaff
                    ? 'Open Staff dashboard to publish routing changes'
                    : 'Staff role required to change routing'
                }
                onClick={() => {
                  if (canStaff) navigate('/staff');
                }}
              >
                Open staff console (reroute)
              </StarkButton>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export const AeroCommand = () => {
  const { state } = useEntryStore();
  const [rerouteActive, setRerouteActive] = useState(false);

  useEffect(() => {
    const ref = doc(db, ROUTING_POLICY_COLLECTION, ROUTING_POLICY_DOC_ID);
    const unsub = onSnapshot(ref, (snap) => {
      const d = snap.data() as { gateRerouteActive?: boolean } | undefined;
      setRerouteActive(Boolean(d?.gateRerouteActive));
    });
    return () => unsub();
  }, []);

  const pressureLabel =
    state.gatePressurePercent != null ? `${Math.round(state.gatePressurePercent)}%` : '—';
  const syncLabel = state.lastSyncTimestamp
    ? state.lastSyncTimestamp.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—';

  return (
    <section className="flex flex-col h-full">
      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Venue operations overview</h1>
        <p className="text-on-surface-variant font-bold text-xs tracking-widest uppercase">
          Shared signals (not a separate forecast engine)
        </p>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-outline max-w-xl">
          Metrics below reuse the same client sync and gate feed as the attendee Dashboard — no random telemetry.
        </p>
      </div>

      <div className="flex-grow grid grid-cols-2 gap-4">
        <StarkCard title="Venue pressure" subtitle="From gateLogistics via app sync">
          <span className="text-4xl font-black text-primary">{pressureLabel}</span>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-outline">
            Gate {state.gatePressureGateId ?? DEFAULT_BOOKING_GATE_ID}
          </p>
        </StarkCard>
        <StarkCard title="Reroute flag" subtitle="routingPolicy/live">
          <span className="text-4xl font-black text-primary">{rerouteActive ? 'On' : 'Off'}</span>
        </StarkCard>
        <StarkCard title="Last client sync" subtitle="Remote Config / orchestration" className="col-span-2 border-t-4 border-black">
          <div className="flex justify-between items-center mt-2 flex-wrap gap-2">
            <span className="text-2xl font-black tracking-tight">{syncLabel}</span>
            <span className="text-xs font-bold uppercase tracking-widest bg-surface-container-highest px-2 py-1 border border-outline">
              Deterministic display
            </span>
          </div>
        </StarkCard>
      </div>
    </section>
  );
};

export const GateCommand = () => {
  const { state, dispatch } = useEntryStore();
  const [syncHint, setSyncHint] = useState<string | null>(null);
  const gateId = state.gatePressureGateId ?? DEFAULT_BOOKING_GATE_ID;
  const pressure =
    state.gatePressurePercent != null ? `${Math.round(state.gatePressurePercent)}%` : '—';

  const syncFeed = () => {
    dispatch({ type: 'UPDATE_DATA_FRESHNESS', payload: new Date() });
    dispatch({ type: 'SET_LAST_SYNC', payload: new Date() });
    setSyncHint(`Feed timestamp refreshed (${new Date().toLocaleTimeString()})`);
  };

  return (
    <section className="flex flex-col h-full">
      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Gate Supervisor</h1>
        <p className="text-on-surface-variant font-bold text-xs tracking-widest uppercase">
          Terminal view (web preview)
        </p>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-outline max-w-xl">
          Scanner and flow-halt actions are not enabled in this web build — use Staff dashboard for routing changes.
        </p>
      </div>

      <div className="flex-grow space-y-4">
        <StarkCard title={`Gate ${gateId}`} subtitle="Pressure from attendee sync" active>
          <p className="mt-4 text-2xl font-black">{pressure}</p>
          {syncHint ? (
            <p className="mt-2 text-xs font-bold text-on-surface-variant normal-case tracking-normal" role="status">
              {syncHint}
            </p>
          ) : null}
          <div className="flex gap-4 mt-4 flex-wrap">
            <StarkButton fullWidth type="button" onClick={syncFeed}>
              Refresh client feed
            </StarkButton>
            <StarkButton
              fullWidth
              variant="secondary"
              type="button"
              disabled
              title="Gate halt is not issued from this web preview"
              aria-label="Halt flow — not available in this web preview"
            >
              Halt flow (unavailable)
            </StarkButton>
          </div>
        </StarkCard>
      </div>
    </section>
  );
};
