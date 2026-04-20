import { describe, it, expect } from "vitest";
import {
    BroadcastEmergencyBodySchema,
    parseJsonBody,
    VertexAggregatorBodySchema,
} from "../validation";
import { isRoutingPolicyRoleAllowed } from "../routingPolicyAuth";

function randomInt(max: number): number {
    return Math.floor(Math.random() * max);
}

function randomPayload(): unknown {
    const kind = randomInt(12);
    switch (kind) {
        case 0:
            return null;
        case 1:
            return undefined;
        case 2:
            return randomInt(1_000_000);
        case 3:
            return "str-" + randomInt(1e9);
        case 4:
            return { key: "k".repeat(randomInt(400)), type: "EVAC" };
        case 5:
            return { key: "", type: "EVAC" };
        case 6:
            return { nested: { a: [{ b: randomInt(99) }] } };
        case 7:
            return { ingestKey: "x", averageDensity: Number.NaN };
        case 8:
            return Array.from({ length: randomInt(8) + 1 }, (_, i) => i);
        case 9:
            return { key: 12345 };
        case 10:
            return { ingestKey: "i", zoneId: "z", pressurePercent: randomInt(100) };
        default:
            return {
                [String.fromCharCode(97 + randomInt(20))]: randomInt(1000),
                extra: { deep: true, n: Math.random() },
            };
    }
}

describe("input fuzzing — validation never throws", () => {
    it("parseJsonBody + BroadcastEmergencyBodySchema across random inputs", () => {
        for (let i = 0; i < 120; i++) {
            const raw = randomPayload();
            const r = parseJsonBody(raw, BroadcastEmergencyBodySchema);
            expect(r.ok === true || r.ok === false).toBe(true);
            if (!r.ok) {
                expect(typeof r.error).toBe("string");
            }
        }
    });

    it("parseJsonBody + VertexAggregatorBodySchema across random inputs", () => {
        for (let i = 0; i < 120; i++) {
            const raw = randomPayload();
            const r = parseJsonBody(raw, VertexAggregatorBodySchema);
            expect(r.ok === true || r.ok === false).toBe(true);
        }
    });

    it("routing policy role helper accepts arbitrary role strings without throwing", () => {
        const roles = ["user", "staff", "admin", "vip", "", "x", "null", "undefined", "🚀"];
        for (let i = 0; i < 80; i++) {
            const emu = i % 2 === 0;
            const role: string | undefined =
                i % 11 === 0 ? undefined : roles[randomInt(roles.length)] + String(randomInt(10));
            expect(() => isRoutingPolicyRoleAllowed(emu, role)).not.toThrow();
            expect(typeof isRoutingPolicyRoleAllowed(emu, role)).toBe("boolean");
        }
    });
});
