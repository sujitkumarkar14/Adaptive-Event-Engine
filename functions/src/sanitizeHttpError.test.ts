import { describe, expect, it } from "vitest";
import { sanitizeHttpErrorDetail } from "./sanitizeHttpError";

describe("sanitizeHttpErrorDetail", () => {
    it("truncates long strings", () => {
        const long = "x".repeat(600);
        expect(sanitizeHttpErrorDetail(long, 100).length).toBeLessThanOrEqual(101);
    });

    it("returns empty for non-strings", () => {
        expect(sanitizeHttpErrorDetail(null)).toBe("");
        expect(sanitizeHttpErrorDetail(123)).toBe("");
    });
});
