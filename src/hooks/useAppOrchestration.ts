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
      if (!cancelled) {
        dispatch({ type: 'SET_LAST_SYNC', payload: new Date() });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  useEffect(() => {
    if (!user) return;
    // Real-time pressure from Firestore `gateLogistics/{gateId}` — written by Vertex AI Vision aggregator (`vertexAggregator`).
    return syncGatePressure(DEFAULT_BOOKING_GATE_ID, dispatch);
  }, [dispatch, user]);

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
