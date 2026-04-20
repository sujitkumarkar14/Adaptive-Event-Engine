/**
 * Pure role check for `updateRoutingPolicyLive` — keep in sync with callable handler.
 * Emulator: any authenticated user may merge (demo without custom claims).
 * Production: only `staff` or `admin` custom claims.
 */
export function isRoutingPolicyRoleAllowed(emulator: boolean, role: string | undefined): boolean {
    if (emulator) {
        return true;
    }
    return role === "staff" || role === "admin";
}
