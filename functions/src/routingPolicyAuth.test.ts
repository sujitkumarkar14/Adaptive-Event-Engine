import { describe, expect, it } from "vitest";
import { isRoutingPolicyRoleAllowed } from "./routingPolicyAuth";

describe("routing policy authorization", () => {
    it("allows any role in emulator mode", () => {
        expect(isRoutingPolicyRoleAllowed(true, undefined)).toBe(true);
        expect(isRoutingPolicyRoleAllowed(true, "user")).toBe(true);
        expect(isRoutingPolicyRoleAllowed(true, "staff")).toBe(true);
    });

    it("allows only staff and admin in production", () => {
        expect(isRoutingPolicyRoleAllowed(false, undefined)).toBe(false);
        expect(isRoutingPolicyRoleAllowed(false, "user")).toBe(false);
        expect(isRoutingPolicyRoleAllowed(false, "staff")).toBe(true);
        expect(isRoutingPolicyRoleAllowed(false, "admin")).toBe(true);
    });
});
