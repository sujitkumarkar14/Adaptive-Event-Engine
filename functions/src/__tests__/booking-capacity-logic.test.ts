import { describe, expect, it } from "vitest";
import { evaluateArrivalWindowRow, isSlotAvailable, reservationOutcome } from "../bookingCapacity";

describe("booking capacity logic (mirrors Spanner reservation checks)", () => {
    it("allows reservation when under capacity", () => {
        expect(isSlotAvailable(0, 100)).toBe(true);
        expect(isSlotAvailable(99, 100)).toBe(true);
        expect(reservationOutcome(99, 100)).toBe("ok");
    });

    it("rejects when capacity exhausted", () => {
        expect(isSlotAvailable(100, 100)).toBe(false);
        expect(reservationOutcome(100, 100)).toBe("capacity_exhausted");
    });

    it("rejects invalid rows", () => {
        expect(reservationOutcome(-1, 10)).toBe("invalid");
        expect(reservationOutcome(0, -1)).toBe("invalid");
    });

    it("evaluateArrivalWindowRow: empty rows means no_slot", () => {
        expect(evaluateArrivalWindowRow([])).toEqual({ ok: false, reason: "no_slot" });
    });

    it("evaluateArrivalWindowRow: capacity_exhausted when at max", () => {
        expect(evaluateArrivalWindowRow([{ capacity_reserved: 100, max_capacity: 100 }])).toEqual({
            ok: false,
            reason: "capacity_exhausted",
        });
    });

    it("evaluateArrivalWindowRow: ok when under capacity", () => {
        expect(evaluateArrivalWindowRow([{ capacity_reserved: 0, max_capacity: 500 }])).toEqual({ ok: true });
    });
});
