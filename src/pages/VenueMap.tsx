import React, { useMemo } from 'react';
import { StarkCard, StarkButton } from '../components/common/StarkComponents';
import { StadiumVenueMapSvg } from '../components/venue/StadiumVenueMapSvg';
import { useEntryStore } from '../store/entryStore';
import {
  facilityStatusToneClass,
  formatFacilityStatusLiveText,
  verticalStatusLabel,
} from '../lib/demoVenueFacilityModel';
import { useNavigate } from 'react-router-dom';
import { useVenueLogistics } from '../hooks/useVenueLogistics';
import { VENUE_MAP_DOM_IDS } from '../constants/venueMap';

export const VenueMap = () => {
  const navigate = useNavigate();
  const { state } = useEntryStore();
  const { live, emergencyActive, tier, nearGate, pack, washSorted, seatSection } = useVenueLogistics(state);

  const facilityAnnouncement = useMemo(
    () => formatFacilityStatusLiveText(live, { emergencyActive }),
    [live, emergencyActive]
  );

  return (
    <section className="flex flex-col h-full max-w-5xl" aria-labelledby={VENUE_MAP_DOM_IDS.heading}>
      <div className="mb-6">
        <h1
          id={VENUE_MAP_DOM_IDS.heading}
          className="text-4xl font-black tracking-tighter uppercase mb-2"
          aria-describedby={VENUE_MAP_DOM_IDS.summary}
        >
          Venue map
        </h1>
        <p
          id={VENUE_MAP_DOM_IDS.summary}
          className="text-on-surface-variant font-bold text-xs tracking-widest uppercase"
        >
          Corridors, washrooms, vending, escalators &amp; lifts — {state.demoMode ? 'live facility status' : 'defaults'}
        </p>
        <p
          id={VENUE_MAP_DOM_IDS.facilityStatusLive}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {facilityAnnouncement}
        </p>
        {seatSection ? (
          <p className="mt-2 text-sm font-bold text-on-surface">
            Your ticket section: <span className="font-mono">{seatSection}</span>
          </p>
        ) : (
          <p className="mt-2 text-xs font-bold uppercase tracking-widest text-outline">
            Use Check-in with a demo ticket (e.g. NMS-AE360-000001) to show your seat tier on the map.
          </p>
        )}
      </div>

      <StarkCard title="Schematic map" subtitle="Gate A cluster (north) — not to scale" className="mb-6">
        <div className="mt-4 overflow-x-auto">
          <StadiumVenueMapSvg facilityStatus={live} highlightTier={tier} emphasisGateId={nearGate} />
        </div>
      </StarkCard>

      {pack ? (
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <StarkCard title="Nearest washrooms" subtitle={`Near ${pack.gate.displayName}`}>
            <ul className="mt-4 space-y-2 text-sm font-bold uppercase tracking-widest">
              {washSorted.map(({ node, vacant }) => (
                <li key={node.id} className="flex justify-between gap-2 border-b border-outline-variant pb-2">
                  <span className="normal-case tracking-normal">{node.label}</span>
                  <span className={vacant ? 'text-secondary' : 'text-error'}>
                    {vacant ? 'Vacant' : 'Occupied'}
                  </span>
                </li>
              ))}
            </ul>
          </StarkCard>

          <StarkCard title="Vertical transport" subtitle="Escalators &amp; elevators by Gate A">
            <div className="mt-4 space-y-3 text-sm font-bold">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-outline mb-1" id="venue-esc-heading">
                  Escalators
                </p>
                <ul className="space-y-1 normal-case" aria-labelledby="venue-esc-heading">
                  {pack.escalators.map(({ node, status }) => (
                    <li key={node.id} className="flex justify-between">
                      <span>Escalator {node.label}</span>
                      <span className={facilityStatusToneClass(status)}>{verticalStatusLabel(status)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-outline mb-1" id="venue-el-heading">
                  Elevators
                </p>
                <ul className="space-y-1 normal-case" aria-labelledby="venue-el-heading">
                  {pack.elevators.map(({ node, status }) => (
                    <li key={node.id} className="flex justify-between">
                      <span>Elevator {node.label}</span>
                      <span className={facilityStatusToneClass(status)}>
                        {verticalStatusLabel(status)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </StarkCard>

          <StarkCard title="Vending" subtitle="Near selected gate">
            <ul className="mt-4 space-y-1 text-sm font-bold normal-case">
              {pack.vending.map((v) => (
                <li key={v.id}>{v.label}</li>
              ))}
            </ul>
          </StarkCard>
        </div>
      ) : null}

      <div className="mt-auto pt-6 border-t border-outline-variant">
        <StarkButton
          variant="secondary"
          type="button"
          onClick={() => navigate('/dashboard')}
          aria-label="Return to live journey dashboard"
        >
          Back to dashboard
        </StarkButton>
      </div>
    </section>
  );
};

export default VenueMap;
