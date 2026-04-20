import React, { useMemo, useState } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { StarkCard, StarkButton } from '../components/common/StarkComponents';
import { db } from '../lib/firebase';
import {
  DEFAULT_BOOKING_GATE_ID,
  ROUTING_POLICY_COLLECTION,
  ROUTING_POLICY_DOC_ID,
} from '../lib/constants';
import { useAuth } from '../contexts/AuthContext';
import { mergeRoutingPolicyLive } from '../services/staffRoutingPolicy';

type GateDoc = {
  currentPressure?: number;
  label?: string;
};

type RoutingLive = {
  gateRerouteActive?: boolean;
  fromGate?: string;
  toGate?: string;
  message?: string;
};

type UserAlertDoc = {
  status?: string;
  location?: string;
  timestamp?: { toMillis?: () => number };
};

/**
 * Staff operations: live gate pressure + broadcast reroute policy to attendees (Firestore `routingPolicy`).
 */
export const StaffDashboard = () => {
  const { staffGates, role, hasRole } = useAuth();
  const canViewPriorityAlerts = role === 'staff' || role === 'admin';
  const primaryGate = staffGates[0] ?? DEFAULT_BOOKING_GATE_ID;
  const [pressure, setPressure] = useState<number | null>(null);
  const [gateLabel, setGateLabel] = useState<string>(primaryGate);
  const [policy, setPolicy] = useState<RoutingLive | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [priorityAlerts, setPriorityAlerts] = useState<Array<{ id: string } & UserAlertDoc>>([]);

  const routingRef = useMemo(
    () => doc(db, ROUTING_POLICY_COLLECTION, ROUTING_POLICY_DOC_ID),
    []
  );
  const logisticsRef = useMemo(() => doc(db, 'gateLogistics', primaryGate), [primaryGate]);

  React.useEffect(() => {
    const u = onSnapshot(
      logisticsRef,
      (snap) => {
        const d = snap.data() as GateDoc | undefined;
        const p = d?.currentPressure;
        setPressure(typeof p === 'number' && Number.isFinite(p) ? p : null);
        if (typeof d?.label === 'string' && d.label) setGateLabel(d.label);
        else setGateLabel(primaryGate);
      },
      () => {
        setPressure(null);
      }
    );
    return () => u();
  }, [logisticsRef, primaryGate]);

  React.useEffect(() => {
    const u = onSnapshot(routingRef, (snap) => {
      setPolicy((snap.data() as RoutingLive | undefined) ?? null);
    });
    return () => u();
  }, [routingRef]);

  React.useEffect(() => {
    if (!canViewPriorityAlerts) {
      setPriorityAlerts([]);
      return;
    }
    const col = collection(db, 'userAlerts');
    const unsub = onSnapshot(
      col,
      (snap) => {
        const rows = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as UserAlertDoc) }))
          .filter((a) => a.status === 'active');
        setPriorityAlerts(rows);
      },
      () => setPriorityAlerts([])
    );
    return () => unsub();
  }, [canViewPriorityAlerts]);

  const triggerReroute = async () => {
    if (!hasRole('staff')) {
      setErr('Staff permissions required.');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await mergeRoutingPolicyLive({
        gateRerouteActive: true,
        fromGate: primaryGate,
        toGate: primaryGate === 'GATE_A' ? 'GATE_B' : 'GATE_A',
        message:
          'CRITICAL: Gate A Congested. Follow Smart Route to Gate B.',
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to update routing policy');
    } finally {
      setBusy(false);
    }
  };

  const clearReroute = async () => {
    setBusy(true);
    setErr(null);
    try {
      await mergeRoutingPolicyLive({ gateRerouteActive: false });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to clear routing policy');
    } finally {
      setBusy(false);
    }
  };

  const tone =
    pressure != null && pressure >= 80 ? 'text-error' : pressure != null && pressure >= 50 ? 'text-tertiary' : 'text-secondary';

  return (
    <section className="flex flex-col gap-6 max-w-3xl" aria-labelledby="staff-dash-heading">
      <div>
        <h1 id="staff-dash-heading" className="text-4xl font-black uppercase tracking-tighter">
          Venue ops
        </h1>
        <p className="text-on-surface-variant font-bold text-xs tracking-widest uppercase mt-1">
          Gate {primaryGate} · role {role}
        </p>
      </div>

      <StarkCard title="Priority alerts" subtitle="Bottom-up assistance signals">
        <div aria-live="assertive" aria-atomic="true" className="mt-4 space-y-3">
          {priorityAlerts.length === 0 ? (
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">No active signals</p>
          ) : (
            priorityAlerts.map((a) => (
              <div
                key={a.id}
                role="status"
                className="border-4 border-[#7f1d1d] bg-black text-white p-4 font-black uppercase tracking-widest text-sm"
              >
                Attendee {a.id} · zone {a.location ?? '—'} · status{' '}
                {a.status ?? '—'}
              </div>
            ))
          )}
        </div>
      </StarkCard>

      <StarkCard title="Live pressure" subtitle={gateLabel} className="border-2 border-on-surface">
        <p className={`mt-4 text-5xl font-black ${tone}`} aria-live="polite">
          {pressure != null ? `${Math.round(pressure)}%` : '—'}
        </p>
        <p className="mt-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
          Source: gateLogistics/{primaryGate}
        </p>
      </StarkCard>

      <StarkCard title="Routing policy" subtitle="Attendee-facing broadcast">
        <div className="mt-4 space-y-4">
          <p className="text-xs font-mono uppercase border border-outline p-3 bg-surface-container-highest">
            reroute active: {policy?.gateRerouteActive ? 'TRUE' : 'FALSE'}
          </p>
          {err ? (
            <p className="text-error text-sm font-bold uppercase" role="alert">
              {err}
            </p>
          ) : null}
          <div className="flex flex-col sm:flex-row gap-3">
            <StarkButton
              variant="primary"
              className="font-black uppercase tracking-widest border-2 border-black bg-black text-white hover:bg-on-surface-variant"
              onClick={triggerReroute}
              disabled={busy || !hasRole('staff')}
              aria-busy={busy}
            >
              Trigger reroute
            </StarkButton>
            <StarkButton variant="secondary" onClick={clearReroute} disabled={busy} aria-busy={busy}>
              Clear reroute
            </StarkButton>
          </div>
        </div>
      </StarkCard>
    </section>
  );
};

export default StaffDashboard;
