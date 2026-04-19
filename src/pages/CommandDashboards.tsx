import React from 'react';
import { StarkCard, StarkButton } from '../components/common/StarkComponents';

export const TrafficCommand = () => {
  return (
    <section className="flex flex-col h-full">
      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tighter uppercase mb-2 text-error">Command Matrix</h1>
        <p className="text-on-surface-variant font-bold text-xs tracking-widest uppercase">
          Traffic Congestion Topology
        </p>
      </div>

      <div className="flex-grow space-y-4">
        <StarkCard title="SECTOR NORTH-WEST" subtitle="Critical Threshold Approaching" className="border-l-error">
          <div className="flex justify-between items-center mt-2">
            <span className="font-bold text-error">Density: 88%</span>
            <StarkButton variant="secondary">Reroute</StarkButton>
          </div>
        </StarkCard>
        
        <StarkCard title="SECTOR SOUTH" subtitle="Flow Nominal">
          <span className="font-bold text-secondary">Density: 42%</span>
        </StarkCard>
      </div>
    </section>
  );
};

export const AeroCommand = () => {
  const [latency, setLatency] = React.useState(186); // Sub-200ms Hot Path

  React.useEffect(() => {
     const i = setInterval(() => {
        setLatency(180 + Math.floor(Math.random() * 30));
     }, 1000);
     return () => clearInterval(i);
  }, []);

  return (
    <section className="flex flex-col h-full">
      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Aero Metric 360</h1>
        <p className="text-on-surface-variant font-bold text-xs tracking-widest uppercase">
          Cloud Spanner Vertex Forecast
        </p>
      </div>

      <div className="flex-grow grid grid-cols-2 gap-4">
        <StarkCard title="INBOUND RATE" subtitle="Expected">
          <span className="text-4xl font-black text-primary">12k / hr</span>
        </StarkCard>
        <StarkCard title="SLOT COMPLIANCE" subtitle="Fast-Pass">
          <span className="text-4xl font-black text-primary">94%</span>
        </StarkCard>
        <StarkCard title="TELEMETRY" subtitle="Cloud Firestore Latency" className="col-span-2 border-t-4 border-black">
          <div className="flex justify-between items-center mt-2">
            <span className="text-2xl font-black tracking-tight">{latency}ms</span>
            <span className="text-xs font-bold text-[#00ff00] uppercase tracking-widest bg-black px-2 py-1">Hot Path Connected</span>
          </div>
        </StarkCard>
      </div>
    </section>
  );
};

export const GateCommand = () => {
  return (
    <section className="flex flex-col h-full">
      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Gate Supervisor</h1>
        <p className="text-on-surface-variant font-bold text-xs tracking-widest uppercase">
          Terminal Operations
        </p>
      </div>

      <div className="flex-grow space-y-4">
        <StarkCard title="GATE B12" subtitle="Active Entry" active>
          <div className="flex gap-4 mt-4">
            <StarkButton fullWidth>Scanner Sync</StarkButton>
            <StarkButton fullWidth variant="secondary" className="border-error text-error">Halt Flow</StarkButton>
          </div>
        </StarkCard>
      </div>
    </section>
  );
};
