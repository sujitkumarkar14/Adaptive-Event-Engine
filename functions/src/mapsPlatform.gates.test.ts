import { afterEach, describe, expect, it, vi } from "vitest";
import {
    allGateCoordinates,
    computeGateEtas,
    destinationForGate,
    GATE_DESTINATIONS,
    normalizeGateId,
} from "./mapsPlatform";

describe("mapsPlatform gate helpers", () => {
    it("normalizeGateId trims and uppercases unknown patterns", () => {
        expect(normalizeGateId("  gate_b ")).toBe("GATE_B");
        expect(normalizeGateId("gate-north")).toBe("GATE-NORTH");
    });

    it("normalizeGateId falls back to GATE_B when empty", () => {
        expect(normalizeGateId(undefined)).toBe("GATE_B");
        expect(normalizeGateId("")).toBe("GATE_B");
    });

    it("destinationForGate uses GATE_DESTINATIONS or defaults to GATE_B", () => {
        const a = destinationForGate("GATE_A");
        expect(a.latitude).toBe(GATE_DESTINATIONS.GATE_A.latitude);
        expect(destinationForGate("UNKNOWN_GATE").latitude).toBe(GATE_DESTINATIONS.GATE_B.latitude);
    });

    it("allGateCoordinates lists every configured gate id", () => {
        const rows = allGateCoordinates();
        expect(rows.length).toBe(Object.keys(GATE_DESTINATIONS).length);
        expect(rows.map((r) => r.gateId).sort()).toContain("GATE_NORTH");
    });
});

describe("computeGateEtas", () => {
    const origFetch = globalThis.fetch;

    afterEach(() => {
        globalThis.fetch = origFetch;
    });

    it("returns an empty array when there are no gate destinations", async () => {
        await expect(computeGateEtas({ apiKey: "k", originLat: 1, originLng: 2, gates: [] })).resolves.toEqual([]);
    });

    it("parses Distance Matrix JSON into sorted gate ETAs", async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                status: "OK",
                rows: [
                    {
                        elements: [
                            {
                                status: "OK",
                                duration: { value: 400 },
                                distance: { value: 500 },
                            },
                            {
                                status: "OK",
                                duration: { value: 200 },
                                distance: { value: 300 },
                            },
                        ],
                    },
                ],
            }),
        });
        globalThis.fetch = fetchMock as unknown as typeof fetch;

        const rows = await computeGateEtas({
            apiKey: "key",
            originLat: 1,
            originLng: 2,
            gates: [
                { gateId: "GATE_A", latitude: 3, longitude: 4 },
                { gateId: "GATE_B", latitude: 5, longitude: 6 },
            ],
        });
        expect(rows.map((r) => r.gateId)).toEqual(["GATE_B", "GATE_A"]);
        expect(rows[0].durationSeconds).toBe(200);
    });
});
