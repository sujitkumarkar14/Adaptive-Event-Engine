import { describe, expect, it } from "vitest";
import { isRoutingPolicyRoleAllowed } from "../routingPolicyAuth";

describe("routing policy permissions", () => {
    it("denies non-staff roles in production mode", () => {
        expect(isRoutingPolicyRoleAllowed(false, "user")).toBe(false);
        expect(isRoutingPolicyRoleAllowed(false, "vip")).toBe(false);
        expect(isRoutingPolicyRoleAllowed(false, undefined)).toBe(false);
    });

    it("allows staff and admin in production mode", () => {
        expect(isRoutingPolicyRoleAllowed(false, "staff")).toBe(true);
        expect(isRoutingPolicyRoleAllowed(false, "admin")).toBe(true);
    });

    it("allows emulator mode for demo without claims", () => {
        expect(isRoutingPolicyRoleAllowed(true, undefined)).toBe(true);
    });
});
