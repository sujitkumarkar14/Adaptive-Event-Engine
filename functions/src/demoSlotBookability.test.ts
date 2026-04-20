import { describe, expect, it } from "vitest";
import { evaluateSlotBookability } from "./demoSlotBookability";

describe("evaluateSlotBookability (Functions)", () => {
    const winStart = new Date("2026-06-01T04:00:00.000Z");
    const winEnd = new Date("2026-06-01T14:00:00.000Z");
    const slotStart = new Date("2026-06-01T10:00:00.000Z");
    const slotEnd = new Date("2026-06-01T10:30:00.000Z");

    it("returns past when now is after slot end", () => {
        expect(
            evaluateSlotBookability({
                now: new Date("2026-06-01T11:00:00.000Z"),
                bookingWindowStart: winStart,
                bookingWindowEnd: winEnd,
                slotStart,
                slotEnd,
                capacityRemaining: 10,
            })
        ).toBe("past");
    });

    it("returns available when inside window and capacity remains", () => {
        expect(
            evaluateSlotBookability({
                now: new Date("2026-06-01T10:15:00.000Z"),
                bookingWindowStart: winStart,
                bookingWindowEnd: winEnd,
                slotStart,
                slotEnd,
                capacityRemaining: 2,
            })
        ).toBe("available");
    });

    it("returns full when capacity hits zero", () => {
        expect(
            evaluateSlotBookability({
                now: new Date("2026-06-01T10:15:00.000Z"),
                bookingWindowStart: winStart,
                bookingWindowEnd: winEnd,
                slotStart,
                slotEnd,
                capacityRemaining: 0,
            })
        ).toBe("full");
    });

    it("returns before_window when booking has not opened", () => {
        expect(
            evaluateSlotBookability({
                now: new Date("2026-06-01T03:00:00.000Z"),
                bookingWindowStart: winStart,
                bookingWindowEnd: winEnd,
                slotStart,
                slotEnd,
                capacityRemaining: 10,
            })
        ).toBe("before_window");
    });

    it("returns after_window when booking closed", () => {
        expect(
            evaluateSlotBookability({
                now: new Date("2026-06-01T15:00:00.000Z"),
                bookingWindowStart: winStart,
                bookingWindowEnd: winEnd,
                slotStart: new Date("2026-06-01T17:00:00.000Z"),
                slotEnd: new Date("2026-06-01T18:00:00.000Z"),
                capacityRemaining: 10,
            })
        ).toBe("after_window");
    });
});
