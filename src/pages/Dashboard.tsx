import React, { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { deleteField, doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { getValue } from 'firebase/remote-config';
import { StarkCard, StarkButton } from '../components/common/StarkComponents';
import { useEntryStore } from '../store/entryStore';
import { ChaosController } from '../components/admin/ChaosController';
import { detectBeaconProximity } from '../services/bleProximity';
import { calculateOptimalPath } from '../services/routing';
import { ConcourseCopilotCard } from '../components/concourse/ConcourseCopilotCard';
import { RewardUnlockedCard } from './Vouchers';
import { db, initRemoteConfig, remoteConfig } from '../lib/firebase';
import {
  DEFAULT_BOOKING_GATE_ID,
  ROUTING_POLICY_COLLECTION,
  ROUTING_POLICY_DOC_ID,
  VENUE_DEMO_ORIGIN,
} from '../lib/constants';
import { useAuth } from '../contexts/AuthContext';
import type { StarkRouteLayer } from '../components/maps/StarkMap';
import { fetchGateEtasMatrix, formatMatrixInsight } from '../services/gateMatrix';
import { translateAlertText, type AlertLang } from '../services/translationClient';

const PRIORITY_CLEARANCE_COPY =
  'EMERGENCY VEHICLE APPROACHING - Please move to the inner concourse and clear the tunnel.';

const SOS_CONFIRM_EN = 'Help is on the way.';

const StarkMapLazy = React.lazy(() =>
  import('../components/maps/StarkMap').then((m) => ({ default: m.StarkMap }))
);

type RoutingPolicy = {
  gateRerouteActive?: boolean;
  fromGate?: string;
  toGate?: string;
  message?: string;
  emergency_vehicle_active?: boolean;
  clearZoneActive?: boolean;
  clearZoneSectors?: string[];
};

export const Dashboard = () => {
  const { state, dispatch } = useEntryStore();
  const { role, user } = useAuth();
  const [bleBusy, setBleBusy] = useState(false);
  const [routingPolicy, setRoutingPolicy] = useState<RoutingPolicy | null>(null);
  const [rcRerouteActive, setRcRerouteActive] = useState(false);
  const [routeLayers, setRouteLayers] = useState<StarkRouteLayer[]>([]);
  const [walkEta, setWalkEta] = useState<string>('—');
  const [vipExpressEta, setVipExpressEta] = useState<string>('—');
  const [matrixInsight, setMatrixInsight] = useState<string | null>(null);
  const [globalEmergencyActive, setGlobalEmergencyActive] = useState(false);
  const [priorityMsg, setPriorityMsg] = useState<string>(PRIORITY_CLEARANCE_COPY);
  const [rerouteMsg, setRerouteMsg] = useState<string>('');
  const [sosBusy, setSosBusy] = useState(false);
  const [sosConfirmation, setSosConfirmation] = useState<string | null>(null);
  const [exitOptimizationBusy, setExitOptimizationBusy] = useState(false);
  const [exitRouteLayer, setExitRouteLayer] = useState<StarkRouteLayer | null>(null);
  const [pendingVoucherCode, setPendingVoucherCode] = useState<string | null>(null);
  const sosSubmittedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void initRemoteConfig().then(() => {
      if (cancelled) return;
      try {
        setRcRerouteActive(getValue(remoteConfig, 'gate_reroute_active').asString() === 'true');
      } catch {
        setRcRerouteActive(false);
      }
    });
    const ref = doc(db, ROUTING_POLICY_COLLECTION, ROUTING_POLICY_DOC_ID);
    const unsub = onSnapshot(ref, (snap) => {
      setRoutingPolicy(snap.exists() ? (snap.data() as RoutingPolicy) : null);
    });
    const evacRef = doc(db, 'globalEvents', 'emergency');
    const unsubEvac = onSnapshot(evacRef, (snap) => {
      const d = snap.data() as { active?: boolean } | undefined;
      setGlobalEmergencyActive(snap.exists() && d?.active === true);
    });
    return () => {
      cancelled = true;
      unsub();
      unsubEvac();
    };
  }, []);

  useEffect(() => {
    if (!user?.uid || !state.gatePressureGateId) return;
    void setDoc(
      doc(db, 'users', user.uid),
      {
        currentLocationZone: state.gatePressureGateId,
        zoneUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }, [user?.uid, state.gatePressureGateId]);

  useEffect(() => {
    if (!user?.uid) {
      setPendingVoucherCode(null);
      return;
    }
    const ref = doc(db, 'users', user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      const v = snap.data()?.pendingVoucherCode;
      setPendingVoucherCode(typeof v === 'string' && v.length > 0 ? v : null);
    });
    return () => unsub();
  }, [user?.uid]);

  const gateRerouteActive =
    Boolean(routingPolicy?.gateRerouteActive) || rcRerouteActive;

  const priorityClearanceActive =
    Boolean(routingPolicy?.emergency_vehicle_active) ||
    Boolean(routingPolicy?.clearZoneActive);

  const destGateForRoute =
    gateRerouteActive && routingPolicy?.toGate
      ? routingPolicy.toGate
      : state.gatePressureGateId ?? DEFAULT_BOOKING_GATE_ID;

  useEffect(() => {
    let cancelled = false;
    const stepFree = state.accessibility.stepFree || state.stepFreeRequired;
    const base = {
      originLat: VENUE_DEMO_ORIGIN.lat,
      originLng: VENUE_DEMO_ORIGIN.lng,
      destinationGate: destGateForRoute,
      stepFreeRequired: stepFree,
    };

    void (async () => {
      const standardP = calculateOptimalPath({ ...base, priority: 'standard' });
      const vipP =
        role === 'vip' ? calculateOptimalPath({ ...base, priority: 'vip' }) : Promise.resolve(null);
      const emergencyP =
        routingPolicy?.emergency_vehicle_active
          ? calculateOptimalPath({ ...base, priority: 'emergency' })
          : Promise.resolve(null);

      const [std, vipR, emR] = await Promise.all([standardP, vipP, emergencyP]);
      if (cancelled) return;

      const layers: StarkRouteLayer[] = [];
      if (std?.encodedPolyline) {
        layers.push({
          encodedPolyline: std.encodedPolyline,
          variant: 'fan',
          smartAccent: gateRerouteActive,
        });
        if (std.perimeterToSeatTime) setWalkEta(std.perimeterToSeatTime);
      }

      if (role === 'vip' && vipR?.encodedPolyline) {
        layers.push({ encodedPolyline: vipR.encodedPolyline, variant: 'vip' });
        if (vipR.perimeterToSeatTime) setVipExpressEta(vipR.perimeterToSeatTime);
      } else {
        setVipExpressEta('—');
      }

      if (routingPolicy?.emergency_vehicle_active && emR?.encodedPolyline) {
        layers.push({
          encodedPolyline: emR.encodedPolyline,
          variant: 'emergency',
        });
      }

      setRouteLayers(layers);
    })();

    return () => {
      cancelled = true;
    };
  }, [
    destGateForRoute,
    state.accessibility.stepFree,
    state.stepFreeRequired,
    state.gatePressureGateId,
    gateRerouteActive,
    routingPolicy?.toGate,
    role,
    routingPolicy?.emergency_vehicle_active,
  ]);

  const mapLayers = useMemo((): StarkRouteLayer[] => {
    if (exitRouteLayer?.encodedPolyline) {
      return [...routeLayers, exitRouteLayer];
    }
    return routeLayers;
  }, [routeLayers, exitRouteLayer]);

  const rerouteHeadline =
    routingPolicy?.message ||
    'CRITICAL: Gate A Congested. Follow Smart Route to Gate B.';
  const fromGate = routingPolicy?.fromGate ?? 'GATE A';
  const toGate = routingPolicy?.toGate ?? 'GATE B';

  useEffect(() => {
    void fetchGateEtasMatrix(VENUE_DEMO_ORIGIN.lat, VENUE_DEMO_ORIGIN.lng).then((d) => {
      if (d?.rankings?.length) {
        setMatrixInsight(formatMatrixInsight(d.rankings));
      } else {
        setMatrixInsight(null);
      }
    });
  }, []);

  useEffect(() => {
    void translateAlertText(PRIORITY_CLEARANCE_COPY, state.preferredContentLanguage as AlertLang).then(
      setPriorityMsg
    );
  }, [state.preferredContentLanguage]);

  useEffect(() => {
    void translateAlertText(rerouteHeadline, state.preferredContentLanguage as AlertLang).then(setRerouteMsg);
  }, [state.preferredContentLanguage, rerouteHeadline]);

  useEffect(() => {
    if (!sosSubmittedRef.current) return;
    void translateAlertText(SOS_CONFIRM_EN, state.preferredContentLanguage as AlertLang).then(setSosConfirmation);
  }, [state.preferredContentLanguage]);

  const needsStepFreeEvac = state.accessibility.stepFree || state.stepFreeRequired;
  const englishEvacCopy = needsStepFreeEvac
    ? 'Emergency detected. Please proceed to the nearest Step-Free exit located at Section 102.'
    : 'Emergency detected. Please proceed to the nearest marked exit immediately.';
  const [globalEvacBannerText, setGlobalEvacBannerText] = useState(englishEvacCopy);

  useEffect(() => {
    if (!globalEmergencyActive) {
      setGlobalEvacBannerText(englishEvacCopy);
      return;
    }
    const raw = needsStepFreeEvac
      ? 'Emergency detected. Please proceed to the nearest Step-Free exit located at Section 102.'
      : 'Emergency detected. Please proceed to the nearest marked exit immediately.';
    if (state.preferredContentLanguage === 'en') {
      setGlobalEvacBannerText(raw);
      return;
    }
    let cancelled = false;
    void translateAlertText(raw, state.preferredContentLanguage as AlertLang).then((t) => {
      if (!cancelled) setGlobalEvacBannerText(t);
    });
    return () => {
      cancelled = true;
    };
  }, [globalEmergencyActive, state.preferredContentLanguage, needsStepFreeEvac]);

  const handleManualRefresh = () => {
    dispatch({ type: 'UPDATE_DATA_FRESHNESS', payload: new Date() });
    if (!state.isOnline) {
      dispatch({ type: 'SET_NETWORK_STATUS', payload: true });
    }
  };

  const triggerOfflineSim = () => {
    dispatch({ type: 'SET_NETWORK_STATUS', payload: false });
  };

  const gateLabel =
    state.currentLocalGate ||
    state.gatePressureGateId ||
    (state.bleBeaconActive ? 'Beacon-linked' : 'GATE B — North Ramps');

  const pressureLabel =
    state.gatePressurePercent != null ? `${Math.round(state.gatePressurePercent)}%` : '—';

  const pressureTone =
    state.gatePressurePercent != null && state.gatePressurePercent >= 80
      ? 'text-error'
      : state.gatePressurePercent != null && state.gatePressurePercent >= 50
        ? 'text-tertiary'
        : 'text-secondary';

  const startBleScan = async () => {
    setBleBusy(true);
    try {
      await detectBeaconProximity((deviceId) => {
        dispatch({ type: 'DETECT_BLE_BEACON', payload: deviceId });
      });
    } finally {
      setBleBusy(false);
    }
  };

  const handleSos = async () => {
    if (!user?.uid) return;
    setSosBusy(true);
    try {
      const zone = state.gatePressureGateId ?? DEFAULT_BOOKING_GATE_ID;
      await setDoc(
        doc(db, 'userAlerts', user.uid),
        {
          status: 'active',
          timestamp: serverTimestamp(),
          location: zone,
        },
        { merge: true }
      );
      sosSubmittedRef.current = true;
      const msg = await translateAlertText(SOS_CONFIRM_EN, state.preferredContentLanguage as AlertLang);
      setSosConfirmation(msg);
    } catch {
      sosSubmittedRef.current = false;
      setSosConfirmation(null);
    } finally {
      setSosBusy(false);
    }
  };

  const handleExitOptimization = async () => {
    setExitOptimizationBusy(true);
    try {
      const stepFree = state.accessibility.stepFree || state.stepFreeRequired;
      const res = await calculateOptimalPath({
        originLat: VENUE_DEMO_ORIGIN.lat,
        originLng: VENUE_DEMO_ORIGIN.lng,
        destinationGate: destGateForRoute,
        stepFreeRequired: stepFree,
        priority: 'standard',
        returnToVehicle: true,
      });
      if (res?.encodedPolyline) {
        setExitRouteLayer({
          encodedPolyline: res.encodedPolyline,
          variant: 'exit',
          smartAccent: true,
        });
      } else {
        setExitRouteLayer(null);
      }
    } finally {
      setExitOptimizationBusy(false);
    }
  };

  const dismissReward = async () => {
    if (!user?.uid) return;
    await setDoc(
      doc(db, 'users', user.uid),
      {
        pendingVoucherCode: deleteField(),
        pendingVoucherAt: deleteField(),
      },
      { merge: true }
    );
  };

  return (
    <section className="flex flex-col h-full space-y-6" aria-labelledby="dashboard-heading">
      <div aria-live="polite" role="status" className="sr-only">
        {state.a11yStatus}
      </div>

      <ChaosController />

      {globalEmergencyActive ? (
        <div
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          className="border-4 border-error bg-black text-error p-4 font-black uppercase tracking-widest text-sm"
        >
          {globalEvacBannerText}
        </div>
      ) : null}

      {priorityClearanceActive ? (
        <div
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          className="border-4 border-[#b71c1c] bg-black text-white p-4 font-black uppercase tracking-widest text-sm"
        >
          {priorityMsg}
        </div>
      ) : null}

      {gateRerouteActive ? (
        <div
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          className="border-4 border-black bg-black text-white p-4 font-black uppercase tracking-widest text-sm"
        >
          {rerouteMsg || rerouteHeadline}
        </div>
      ) : null}

      <div className="border-4 border-black bg-surface p-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-on-surface-variant mb-3">
          Priority assistance
        </h2>
        <button
          type="button"
          onClick={handleSos}
          disabled={sosBusy || !user?.uid}
          aria-label="SOS: request immediate assistance from venue staff. Your last known zone will be shared."
          className="w-full min-h-[48px] min-w-[48px] px-4 py-3 bg-[#7f1d1d] text-white border-4 border-black font-black uppercase tracking-widest text-sm hover:bg-[#991b1b] focus:outline-none focus-visible:ring-4 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:opacity-60 rounded-none"
        >
          {sosBusy ? 'Sending…' : 'SOS — request help'}
        </button>
        {sosConfirmation ? (
          <p
            role="status"
            aria-live="assertive"
            className="mt-3 text-sm font-black uppercase tracking-widest text-on-surface border-2 border-black px-3 py-2 bg-white"
          >
            {sosConfirmation}
          </p>
        ) : null}
      </div>

      <ConcourseCopilotCard
        liveOccupancyPercent={state.gatePressurePercent}
        matrixInsight={matrixInsight}
        alertLang={state.preferredContentLanguage}
        onAlertLangChange={(lang) =>
          dispatch({ type: 'SET_PREFERRED_CONTENT_LANGUAGE', payload: lang })
        }
        onExitOptimization={handleExitOptimization}
        exitOptimizationBusy={exitOptimizationBusy}
      />

      {pendingVoucherCode ? (
        <RewardUnlockedCard voucherCode={pendingVoucherCode} onDismiss={dismissReward} />
      ) : null}

      <div>
        <h1 id="dashboard-heading" className="text-4xl font-black tracking-tighter uppercase mb-2">
          Live Journey
        </h1>
        <p className="text-on-surface-variant font-bold text-xs tracking-widest uppercase">
          Routing &amp; Rerouting
        </p>
      </div>

      <StarkCard title="BLE PROXIMITY" subtitle="Web Bluetooth edge handshake">
        <div className="mt-4 flex flex-col gap-4">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
            {state.bleBeaconActive ? `Linked: ${state.currentLocalGate ?? 'device'}` : 'No beacon lock'}
          </p>
          <StarkButton
            variant="secondary"
            onClick={startBleScan}
            disabled={bleBusy}
            aria-busy={bleBusy}
            className="text-xs tracking-widest"
          >
            {bleBusy ? 'Scanning…' : 'Start Scanning'}
          </StarkButton>
        </div>
      </StarkCard>

      <StarkCard title="ARCORE GEOSPATIAL ANCHOR" subtitle="Awaiting Camera Permissions">
        <div className="flex justify-between items-center mt-2 relative">
          <div className="text-xs font-mono text-outline-variant space-y-1">
            <p>&gt; YAW/PITCH DATA PENDING</p>
            <p>&gt; LAT: 34.0522, LNG: -118.2437</p>
          </div>
          <StarkButton variant="tertiary" className="text-xs tracking-widest">
            Mock AR Overlay
          </StarkButton>
        </div>
      </StarkCard>

      <StarkCard title="CURRENT STATUS" subtitle="In Transit to Venue" />

      <StarkCard title="Wayfinding" subtitle="Walking route — Maps Routes API">
        <div
          className="mt-4"
          role="region"
          aria-label="Walking route map"
          aria-live="polite"
        >
          <Suspense
            fallback={
              <div className="border-2 border-outline p-6 text-xs font-black uppercase tracking-widest text-outline">
                Loading route…
              </div>
            }
          >
            <StarkMapLazy
              layers={mapLayers.length > 0 ? mapLayers : null}
              smartPathMode={gateRerouteActive}
              smartRerouteActive={gateRerouteActive && !priorityClearanceActive}
              priorityClearanceActive={priorityClearanceActive}
              label={
                exitRouteLayer
                  ? 'Exit optimization — walking route to parking zone'
                  : priorityClearanceActive
                    ? 'Priority mesh — clearance active'
                    : gateRerouteActive
                      ? 'Smart path to preferred gate — high contrast'
                      : 'Walking path preview'
              }
            />
          </Suspense>
          {exitRouteLayer ? (
            <StarkButton
              variant="tertiary"
              className="mt-4 uppercase tracking-widest text-xs"
              type="button"
              onClick={() => setExitRouteLayer(null)}
            >
              Clear exit preview
            </StarkButton>
          ) : null}
        </div>
      </StarkCard>

      <div className="flex flex-col gap-6 mb-8">
        <StarkCard title="Current Assignment" subtitle="Proceed via Central Corridor" active>
          <div className="mt-4 p-4 bg-primary-fixed text-on-primary-fixed font-bold flex flex-col">
            <span className="text-[10px] tracking-widest uppercase mb-2">Next Waypoint</span>
            <span className="text-3xl font-black">{gateRerouteActive ? toGate : gateLabel}</span>
          </div>
        </StarkCard>

        {gateRerouteActive ? (
          <StarkCard
            title="Smart route map"
            subtitle="Alternate path — high visibility"
            className="border-4 border-black"
          >
            <div
              className="mt-4 grid grid-cols-[1fr_auto_1fr] gap-2 items-stretch text-center font-black uppercase text-xs tracking-widest"
              aria-label={`Smart route from ${fromGate} to ${toGate}`}
            >
              <div className="p-4 border-2 border-outline flex flex-col justify-center opacity-60 line-through">
                <span className="text-[10px] mb-1">Avoid</span>
                {fromGate}
              </div>
              <div className="flex items-center justify-center px-2 text-on-surface-variant" aria-hidden>
                →
              </div>
              <div className="p-4 flex flex-col justify-center border-2 border-black bg-black text-white">
                <span className="text-[10px] mb-1 text-white/80">Follow</span>
                {toGate}
              </div>
            </div>
            <p className="sr-only" aria-live="polite">
              Reroute active. Preferred gate {toGate}. Avoid {fromGate}.
            </p>
          </StarkCard>
        ) : null}

        <div
          className={`grid gap-4 ${role === 'vip' ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2'}`}
        >
          {role === 'vip' ? (
            <>
              <StarkCard title="Lounge Capacity" subtitle="Presidential level — suite cluster">
                <span className="text-2xl font-black text-[#E6C200]">64%</span>
              </StarkCard>
              <StarkCard title="Express Route" subtitle="Presidential Suite">
                <span className="text-2xl font-black text-[#E6C200]" aria-live="polite">
                  {vipExpressEta}
                </span>
              </StarkCard>
              <StarkCard title="ETA" subtitle="Walking (concourse)">
                <span className="text-2xl font-black text-secondary" aria-live="polite">
                  {walkEta}
                </span>
              </StarkCard>
            </>
          ) : (
            <>
              <StarkCard title="Gate Pressure" subtitle="Hot path Firestore">
                <span className={`text-2xl font-black ${pressureTone}`}>{pressureLabel}</span>
              </StarkCard>
              <StarkCard title="ETA" subtitle="Walking">
                <span className="text-2xl font-black text-secondary" aria-live="polite">
                  {walkEta}
                </span>
              </StarkCard>
            </>
          )}
        </div>
      </div>

      <div className="mt-auto pt-8 border-t-[1px] border-outline-variant space-y-4">
        <label className="font-['Inter'] font-bold uppercase tracking-widest text-[10px] text-outline block">
          Simulator Controls
        </label>
        <div className="flex gap-4">
          <StarkButton
            variant="secondary"
            fullWidth
            onClick={triggerOfflineSim}
            className={!state.isOnline ? 'bg-error text-white border-error' : ''}
          >
            {state.isOnline ? 'Simulate Drop' : 'Drop Active'}
          </StarkButton>
          <StarkButton fullWidth onClick={handleManualRefresh} icon="sync">
            Force Sync
          </StarkButton>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
