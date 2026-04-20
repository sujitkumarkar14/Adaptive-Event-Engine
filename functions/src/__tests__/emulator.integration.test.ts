/**
 * Run against Firebase emulators only (not enabled in default `npm test`).
 *
 *   npm run test:emulator
 *
 * Requires compiled handlers (`npm run build` in `functions/`). Uses:
 * - Auth + Functions + Firestore emulators
 * - `reserveEntrySlot`: auth + validation + Spanner path (Spanner unavailable here → `internal` after valid payload)
 * - `updateRoutingPolicyLive`: auth + Firestore merge (Admin SDK) + client read to assert persisted state
 */
import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator, signInAnonymously, signOut } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, doc, getDoc } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator, httpsCallable } from "firebase/functions";
import { FirebaseError } from "firebase/app";

const run = process.env.RUN_EMULATOR_TESTS === "1";

function expectFirebaseError(e: unknown, code: string) {
    expect(e).toBeInstanceOf(FirebaseError);
    expect((e as FirebaseError).code).toBe(code);
}

if (run) {
    describe("Firebase emulators (auth + functions + firestore)", () => {
        const app = initializeApp({
            projectId: "adaptive-entry",
            apiKey: "fake-emulator-key",
            appId: "1:1:web:emulator",
        });
        const auth = getAuth(app);
        const fns = getFunctions(app, "us-central1");
        const db = getFirestore(app);

        beforeAll(async () => {
            connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
            connectFunctionsEmulator(fns, "127.0.0.1", 5001);
            connectFirestoreEmulator(db, "127.0.0.1", 8080);
            await signInAnonymously(auth);
        });

        afterEach(async () => {
            if (!auth.currentUser) {
                await signInAnonymously(auth);
            }
        });

        it("reserveEntrySlot: rejects unauthenticated calls", async () => {
            await signOut(auth);
            const fn = httpsCallable(fns, "reserveEntrySlot");
            try {
                await fn({ slotId: "slot_a", gateId: "GATE_A" });
                expect.fail("expected rejection");
            } catch (e) {
                expectFirebaseError(e, "functions/unauthenticated");
            }
        });

        it("reserveEntrySlot: rejects malformed slotId/gateId when authenticated", async () => {
            if (!auth.currentUser) await signInAnonymously(auth);
            const fn = httpsCallable(fns, "reserveEntrySlot");
            try {
                await fn({ slotId: "bad slot!", gateId: "GATE_A" });
                expect.fail("expected rejection");
            } catch (e) {
                expectFirebaseError(e, "functions/invalid-argument");
            }
            try {
                await fn({ slotId: "ok_slot", gateId: "lowercase-gate" });
                expect.fail("expected rejection");
            } catch (e) {
                expectFirebaseError(e, "functions/invalid-argument");
            }
        });

        /**
         * Valid payload passes validation and reaches Spanner; emulator has no Cloud Spanner → internal error.
         * Proves authenticated + schema-valid request enters the transactional path.
         */
        it("reserveEntrySlot: authenticated valid payload fails at Spanner (no emulator DB)", async () => {
            if (!auth.currentUser) await signInAnonymously(auth);
            const fn = httpsCallable(fns, "reserveEntrySlot");
            try {
                await fn({ slotId: "slot_1", gateId: "GATE_A" });
                expect.fail("expected rejection");
            } catch (e) {
                expectFirebaseError(e, "functions/internal");
            }
        });

        it("updateRoutingPolicyLive: authenticated user persists merge to routingPolicy/live (Firestore)", async () => {
            if (!auth.currentUser) await signInAnonymously(auth);
            const fn = httpsCallable(fns, "updateRoutingPolicyLive");
            const marker = `emu-${Date.now()}`;
            await fn({ message: marker });

            const snap = await getDoc(doc(db, "routingPolicy", "live"));
            expect(snap.exists()).toBe(true);
            const data = snap.data() as { message?: string };
            expect(data.message).toBe(marker);
        });
    });
} else {
    describe.skip("Firebase emulators — set RUN_EMULATOR_TESTS=1 (see npm run test:emulator)", () => {
        it("skipped", () => undefined);
    });
}
