import { beforeEach, describe, expect, it, vi } from "vitest";

const logMocks = vi.hoisted(() => ({
    loggerInfo: vi.fn(),
}));

vi.mock("firebase-functions", () => {
    class HttpsError extends Error {
        readonly code: string;
        constructor(code: string, message?: string) {
            super(message);
            this.name = "HttpsError";
            this.code = code;
        }
    }
    return {
        https: {
            onCall: (handler: (req: unknown) => Promise<unknown>) => handler,
            HttpsError,
        },
        logger: { info: logMocks.loggerInfo, error: vi.fn() },
    };
});

const gfs = vi.hoisted(() => ({
    attendeeGet: vi.fn(),
    eventSnap: {} as { exists: boolean; data?: () => Record<string, unknown> },
    slotSnap: {} as { exists: boolean; data?: () => Record<string, unknown> },
}));

vi.mock("firebase-admin", () => {
    function firestore() {
        return {
            collection: (name: string) => {
                if (name === "users") {
                    return { doc: () => ({ path: "users/x" }) };
                }
                if (name === "demoEvents") {
                    return {
                        doc: (_eventId: string) => ({
                            kind: "event" as const,
                            collection: (sub: string) => {
                                if (sub === "attendees") {
                                    return {
                                        doc: () => ({ get: () => gfs.attendeeGet() }),
                                    };
                                }
                                if (sub === "slots") {
                                    return {
                                        doc: () => ({ kind: "slot" as const }),
                                    };
                                }
                                throw new Error(sub);
                            },
                        }),
                    };
                }
                throw new Error(name);
            },
            runTransaction: async (fn: (tx: never) => Promise<void>) => {
                const tx = {
                    get: async (ref: { kind?: string }) => {
                        if (ref.kind === "event") return gfs.eventSnap;
                        if (ref.kind === "slot") return gfs.slotSnap;
                        throw new Error("bad ref");
                    },
                    update: vi.fn(),
                    set: vi.fn(),
                };
                await fn(tx as never);
            },
        };
    }
    firestore.FieldValue = { serverTimestamp: () => ({ __serverTimestamp: true }) };

    const pkg = { firestore };
    return {
        ...pkg,
        default: pkg,
    };
});

import { lookupDemoAttendee, reserveDemoSlot } from "./demoCallables";

type Authed = { auth: { uid: string } | null; data: unknown };

describe("demoCallables", () => {
    beforeEach(() => {
        logMocks.loggerInfo.mockClear();
        gfs.attendeeGet.mockReset();
        gfs.eventSnap = { exists: false };
        gfs.slotSnap = { exists: false };
    });

    it("lookupDemoAttendee: throws when unauthenticated", async () => {
        const fn = lookupDemoAttendee as (req: Authed) => Promise<unknown>;
        await expect(fn({ auth: null, data: {} })).rejects.toMatchObject({ code: "unauthenticated" });
    });

    it("lookupDemoAttendee: returns found false when doc missing", async () => {
        gfs.attendeeGet.mockResolvedValue({ exists: false });
        const fn = lookupDemoAttendee as (req: Authed) => Promise<unknown>;
        const out = await fn({
            auth: { uid: "u1" },
            data: { eventId: "ev1", ticketNumber: "T-1" },
        });
        expect(out).toEqual({ found: false });
        expect(logMocks.loggerInfo).toHaveBeenCalled();
    });

    it("lookupDemoAttendee: maps attendee fields when present", async () => {
        gfs.attendeeGet.mockResolvedValue({
            exists: true,
            data: () => ({
                name: "Pat",
                ticketNumber: "T-99",
                seatSection: "A",
                assignedGate: "GATE_NORTH",
                arrivalSlot: "s1",
                status: "expected",
                stepFree: true,
                lowSensory: false,
                visualAid: true,
            }),
        });
        const fn = lookupDemoAttendee as (req: Authed) => Promise<unknown>;
        const out = (await fn({
            auth: { uid: "u1" },
            data: { eventId: "ev1", ticketNumber: "T-99" },
        })) as { found: true; attendee: Record<string, unknown> };
        expect(out.found).toBe(true);
        expect(out.attendee.name).toBe("Pat");
        expect(out.attendee.stepFree).toBe(true);
        expect(out.attendee.assignedGate).toBe("GATE_NORTH");
    });

    it("reserveDemoSlot: throws when unauthenticated", async () => {
        const fn = reserveDemoSlot as (req: Authed) => Promise<unknown>;
        await expect(fn({ auth: null, data: {} })).rejects.toMatchObject({ code: "unauthenticated" });
    });

    it("reserveDemoSlot: fails precondition when event or slot missing", async () => {
        gfs.eventSnap = { exists: false };
        gfs.slotSnap = { exists: true, data: () => ({}) };
        const fn = reserveDemoSlot as (req: Authed) => Promise<unknown>;
        await expect(
            fn({
                auth: { uid: "u1" },
                data: { eventId: "ev1", slotId: "s1", gateId: "GATE_NORTH" },
            })
        ).rejects.toMatchObject({ code: "failed-precondition" });
    });

    it("reserveDemoSlot: succeeds when bookable and decrements capacity", async () => {
        const ts = (d: Date) => ({ toDate: () => d });
        gfs.eventSnap = {
            exists: true,
            data: () => ({
                bookingWindowStart: ts(new Date(2020, 0, 1)),
                bookingWindowEnd: ts(new Date(2035, 0, 1)),
            }),
        };
        gfs.slotSnap = {
            exists: true,
            data: () => ({
                startTime: ts(new Date(2030, 5, 1, 14, 0)),
                endTime: ts(new Date(2030, 5, 1, 15, 0)),
                capacityRemaining: 4,
                defaultGate: "GATE_NORTH",
            }),
        };
        const fn = reserveDemoSlot as (req: Authed) => Promise<unknown>;
        const out = (await fn({
            auth: { uid: "user-z" },
            data: { eventId: "ev1", slotId: "s1", gateId: "GATE_NORTH" },
        })) as { status: string; transactionId: string; mode: string };
        expect(out.status).toBe("SUCCESS");
        expect(out.mode).toBe("demo");
        expect(out.transactionId).toMatch(/^demo-/);
    });

    it("reserveDemoSlot: fails when bookability is not available (closed window)", async () => {
        const ts = (d: Date) => ({ toDate: () => d });
        gfs.eventSnap = {
            exists: true,
            data: () => ({
                bookingWindowStart: ts(new Date(2020, 0, 1)),
                bookingWindowEnd: ts(new Date(2020, 0, 2)),
            }),
        };
        gfs.slotSnap = {
            exists: true,
            data: () => ({
                startTime: ts(new Date(2030, 5, 1, 14, 0)),
                endTime: ts(new Date(2030, 5, 1, 15, 0)),
                capacityRemaining: 2,
                defaultGate: "GATE_NORTH",
            }),
        };
        const fn = reserveDemoSlot as (req: Authed) => Promise<unknown>;
        await expect(
            fn({
                auth: { uid: "u1" },
                data: { eventId: "ev1", slotId: "s1", gateId: "GATE_NORTH" },
            })
        ).rejects.toMatchObject({ code: "failed-precondition" });
    });
});
