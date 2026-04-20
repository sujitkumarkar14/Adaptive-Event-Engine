import { describe, expect, it } from "vitest";
import { isSlotAvailable, reservationOutcome } from "../bookingCapacity";

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
});
