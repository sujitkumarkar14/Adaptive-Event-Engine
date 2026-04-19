import React, { useState } from 'react';
import { StarkCard, StarkButton } from '../components/common/StarkComponents';
import { useEntryStore } from '../store/entryStore';
import { ChaosController } from '../components/admin/ChaosController';
import { detectBeaconProximity } from '../services/bleProximity';

export const Dashboard = () => {
  const { state, dispatch } = useEntryStore();
  const [bleBusy, setBleBusy] = useState(false);

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

  return (
    <section className="flex flex-col h-full space-y-6" aria-labelledby="dashboard-heading">
      <div aria-live="polite" role="status" className="sr-only">
        {state.a11yStatus}
      </div>

      <ChaosController />

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

      <div className="flex flex-col gap-6 mb-8">
        <StarkCard title="Current Assignment" subtitle="Proceed via Central Corridor" active>
          <div className="mt-4 p-4 bg-primary-fixed text-on-primary-fixed font-bold flex flex-col">
            <span className="text-[10px] tracking-widest uppercase mb-2">Next Waypoint</span>
            <span className="text-3xl font-black">{gateLabel}</span>
          </div>
        </StarkCard>

        <div className="grid grid-cols-2 gap-4">
          <StarkCard title="Gate Pressure" subtitle="Hot path Firestore">
            <span className={`text-2xl font-black ${pressureTone}`}>{pressureLabel}</span>
          </StarkCard>
          <StarkCard title="ETA" subtitle="Walking">
            <span className="text-2xl font-black text-secondary">14 mins</span>
          </StarkCard>
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
