import { useEffect, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { initRemoteConfig, db } from '../lib/firebase';
import { syncGatePressure } from '../lib/firestore';
import { useEntryStore } from '../store/entryStore';
import { useTranslation } from './useTranslation';
import { DEFAULT_BOOKING_GATE_ID } from '../lib/constants';
import { subscribeVenueFcmTopics } from '../lib/fcmRegister';

/**
 * Remote Config bootstrap, authenticated gate pressure sync, and global emergency Firestore mesh.
 * Isolated from UI; mounted once from the app shell.
 */
export function useAppOrchestration(user: User | null) {
  const { dispatch, state } = useEntryStore();
  const stepFreeRequired = state.stepFreeRequired;
  const stepFreePref = state.accessibility.stepFree;
  const { announceEmergency, t } = useTranslation();
  const emergencyActiveRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    initRemoteConfig().finally(() => {
      const applySync = () => {
        if (!cancelled) {
          dispatch({ type: 'SET_LAST_SYNC', payload: new Date() });
        }
      };
      const ric = typeof window !== 'undefined' ? window.requestIdleCallback : undefined;
      if (typeof ric === 'function') {
        ric(applySync, { timeout: 2000 });
      } else {
        void Promise.resolve().then(() => setTimeout(applySync, 0));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  useEffect(() => {
    if (!user) return;
    if (state.demoMode && state.demoEventId) {
      const ref = doc(db, 'demoEvents', state.demoEventId, 'aggregates', 'live');
      const unsub = onSnapshot(
        ref,
        (snap) => {
          const gates = snap.data()?.gates as Record<string, number> | undefined;
          const primary =
            typeof gates?.[DEFAULT_BOOKING_GATE_ID] === 'number'
              ? gates![DEFAULT_BOOKING_GATE_ID]
              : typeof gates?.GATE_NORTH === 'number'
                ? gates.GATE_NORTH
                : Object.values(gates ?? {})[0];
          if (typeof primary === 'number' && Number.isFinite(primary)) {
            const p = Math.min(100, Math.max(0, Math.round(primary)));
            dispatch({
              type: 'UPDATE_GATE_PRESSURE',
              payload: { percent: p, gateId: DEFAULT_BOOKING_GATE_ID, at: new Date() },
            });
          }
        },
        () => undefined
      );
      return () => unsub();
    }
    // Real-time pressure from Firestore `gateLogistics/{gateId}` — written by Vertex AI Vision aggregator (`vertexAggregator`).
    return syncGatePressure(DEFAULT_BOOKING_GATE_ID, dispatch);
  }, [dispatch, user, state.demoMode, state.demoEventId]);

  useEffect(() => {
    if (!user) return;
    void subscribeVenueFcmTopics().catch(() => undefined);
  }, [user]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'globalEvents', 'emergency'), (snap) => {
      const d = snap.data();
      if (d?.active === true) {
        if (!emergencyActiveRef.current) {
          emergencyActiveRef.current = true;
          dispatch({ type: 'TRIGGER_EMERGENCY' });
          const needsStepFree = stepFreePref || stepFreeRequired;
          if (needsStepFree) {
            announceEmergency(
              'Emergency detected. Please proceed to the nearest Step-Free exit located at Section 102.'
            );
          } else {
            announceEmergency(
              t(
                'emergency.evacuate',
                'Emergency detected. Please proceed to the nearest marked exit immediately.'
              )
            );
          }
        }
      } else {
        emergencyActiveRef.current = false;
      }
    });
    return () => unsub();
  }, [dispatch, announceEmergency, t, stepFreePref, stepFreeRequired]);
}
