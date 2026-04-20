/**
 * Central Vitest helpers that simulate Firebase client and Spanner-like edge cases
 * (latency, empty snapshots, contention-shaped errors) without `any`.
 */
import { vi } from 'vitest';

export type FirestoreSnapshot = { data: () => unknown };

/** Simulates a slow first snapshot callback (network latency). */
export function createLatentOnSnapshot(latencyMs: number, payload: unknown) {
  return (_ref: unknown, onNext: (snap: FirestoreSnapshot) => void) => {
    const id = window.setTimeout(() => {
      onNext({ data: () => payload });
    }, latencyMs);
    return () => window.clearTimeout(id);
  };
}

/** Firestore `onSnapshot` error path used when rules deny reads or the channel fails. */
export function createOnSnapshotError(err: Error) {
  return (
    _ref: unknown,
    _onNext: (snap: FirestoreSnapshot) => void,
    onError?: (e: Error) => void
  ) => {
    if (onError) onError(err);
    return vi.fn();
  };
}

/** Maps a string to a synthetic Spanner `ABORTED` / contention scenario for callable tests. */
export function isSpannerContentionMessage(message: string): boolean {
  return /ABORTED|ABORT|deadline|contention/i.test(message);
}
