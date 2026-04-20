import type { Dispatch } from 'react';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { EntryAction } from '../store/entryStore';

interface GatePressureDoc {
  currentPressure?: number;
  pressurePercent?: number;
  lastUpdated?: Timestamp | Date;
}

function coerceDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return new Date();
}

/**
 * Hot Path: Listen for instantaneous gate pressure updates dispatched by Vertex Aggregator over
 * Firestore. Operates fully offline after the first payload syncs.
 */
export const syncGatePressure = (gateId: string, dispatch: Dispatch<EntryAction>) => {
  const docRef = doc(db, 'gateLogistics', gateId);

  const unsubscribe = onSnapshot(
    docRef,
    (snapshot) => {
      if (!snapshot.exists()) return;
      const raw = snapshot.data() as GatePressureDoc;
      const fromPressure =
        typeof raw.pressurePercent === 'number'
          ? raw.pressurePercent
          : typeof raw.currentPressure === 'number'
            ? raw.currentPressure
            : Number(raw.pressurePercent ?? raw.currentPressure) || 0;
      const percent = Math.min(100, Math.max(0, fromPressure));
      const at = coerceDate(raw.lastUpdated);
      dispatch({
        type: 'UPDATE_GATE_PRESSURE',
        payload: { percent, gateId, at },
      });
    },
    (error) => {
      console.error(`[HotPath] Snapshot read disconnected. Yielding to IndexedDB cache.`, error);
    }
  );

  return unsubscribe;
};
