import { useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DEFAULT_DEMO_EVENT_ID } from '../lib/demoConstants';
import { parseDemoSeatLevel } from '../lib/seatSectionMap';
import type { EntryState } from '../store/entryStore';
import {
  inferNearGateFromStore,
  mergeFacilityStatus,
  packAmenitiesNearGate,
  parseFirestoreFacilityLive,
  sortWashroomsForUi,
} from '../lib/demoVenueFacilityModel';
import type { AmenityNearGatePack, FacilityStatusDoc } from '../lib/demoVenueFacilityModel';

type VenueStoreSlice = Pick<
  EntryState,
  'demoMode' | 'demoEventId' | 'gatePressureGateId' | 'currentLocalGate' | 'demoSeatSection'
>;

/**
 * Subscribes to `facilityStatus/live` in demo mode and derives nearest-gate amenity packs for VenueMap.
 * **Complexity:** Snapshot handler is **O(keys)** merge; packing is **O(nodes)** for the static demo graph.
 */
export function useVenueLogistics(state: VenueStoreSlice): {
  live: FacilityStatusDoc;
  emergencyActive: boolean;
  tier: number | null;
  nearGate: ReturnType<typeof inferNearGateFromStore>;
  pack: AmenityNearGatePack | null;
  washSorted: AmenityNearGatePack['washrooms'];
  seatSection: string | null;
} {
  const eventId = state.demoEventId ?? DEFAULT_DEMO_EVENT_ID;
  const [live, setLive] = useState<FacilityStatusDoc>(() => mergeFacilityStatus(null));
  const [emergencyActive, setEmergencyActive] = useState(false);

  useEffect(() => {
    if (!state.demoMode) {
      setLive(mergeFacilityStatus(null));
      setEmergencyActive(false);
      return;
    }
    const ref = doc(db, 'demoEvents', eventId, 'facilityStatus', 'live');
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const { doc: parsed, emergencyActive: emerg } = parseFirestoreFacilityLive(snap.data());
        setEmergencyActive(emerg);
        setLive(mergeFacilityStatus(parsed));
      },
      () => {
        setLive(mergeFacilityStatus(null));
        setEmergencyActive(false);
      }
    );
    return () => unsub();
  }, [state.demoMode, eventId]);

  const seatSection = state.demoSeatSection;
  const tier = useMemo(() => (seatSection ? parseDemoSeatLevel(seatSection) : null), [seatSection]);

  const nearGate = inferNearGateFromStore(state.gatePressureGateId, state.currentLocalGate);
  const pack = packAmenitiesNearGate(nearGate, live);
  const washSorted = pack ? sortWashroomsForUi(pack.washrooms) : [];

  return { live, emergencyActive, tier, nearGate, pack, washSorted, seatSection };
}
