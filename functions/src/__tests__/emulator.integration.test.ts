/**
 * Run against Firebase emulators only (not enabled in default CI).
 *
 *   npx firebase emulators:exec --only auth,functions --project adaptive-entry \
 *     'cd functions && npm run build && RUN_EMULATOR_TESTS=1 npm test -- emulator.integration'
 *
 * Requires compiled handlers (`npm run build` in `functions/`). This suite only asserts
 * unauthenticated rejection — success paths still require Cloud Spanner.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator, signInAnonymously, signOut } from "firebase/auth";
import { getFunctions, connectFunctionsEmulator, httpsCallable } from "firebase/functions";

const run = process.env.RUN_EMULATOR_TESTS === "1";

if (run) {
    describe("reserveEntrySlot (Firebase emulators)", () => {
        const app = initializeApp({
            projectId: "adaptive-entry",
            apiKey: "fake-emulator-key",
            appId: "1:1:web:emulator",
        });
        const auth = getAuth(app);
        const fns = getFunctions(app, "us-central1");

        beforeAll(async () => {
            connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
            connectFunctionsEmulator(fns, "127.0.0.1", 5001);
            await signInAnonymously(auth);
        });

        it("rejects callable after sign-out (unauthenticated)", async () => {
            await signOut(auth);
            const fn = httpsCallable(fns, "reserveEntrySlot");
            await expect(fn({ slotId: "s1", gateId: "GATE_A" })).rejects.toThrow();
        });
    });
} else {
    describe.skip("reserveEntrySlot (Firebase emulators — set RUN_EMULATOR_TESTS=1)", () => {
        it("placeholder", () => undefined);
    });
}
