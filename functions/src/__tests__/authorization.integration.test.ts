import { describe, expect, it } from "vitest";
import { isRoutingPolicyRoleAllowed } from "../routingPolicyAuth";
import { sanitizeHttpErrorDetail } from "../sanitizeHttpError";
import { parseJsonBody, BroadcastEmergencyBodySchema } from "../validation";

/**
 * Cross-cutting security checks used by HTTP + callables (no live Firebase in tests).
 */
describe("authorization & sanitization integration", () => {
    it("production routing policy rejects attendee-like roles", () => {
        expect(isRoutingPolicyRoleAllowed(false, "user")).toBe(false);
    });

    it("sanitize strips non-strings and truncates", () => {
        expect(sanitizeHttpErrorDetail(null)).toBe("");
        expect(sanitizeHttpErrorDetail("a".repeat(600), 10).length).toBeLessThanOrEqual(12);
    });

    it("malformed emergency JSON fails parse before any auth", () => {
        const r = parseJsonBody({ foo: 1 }, BroadcastEmergencyBodySchema);
        expect(r.ok).toBe(false);
    });
});
