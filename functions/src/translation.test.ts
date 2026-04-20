import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { translateText } from "./translation";

describe("translateText", () => {
    const fetchMock = vi.fn();

    beforeEach(() => {
        globalThis.fetch = fetchMock as unknown as typeof fetch;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("returns emptyish text without calling the API", async () => {
        expect(await translateText({ apiKey: "k", text: "   ", target: "hi" })).toBe("   ");
    });

    it("returns source text when target is English", async () => {
        expect(await translateText({ apiKey: "k", text: "Hello", target: "en" })).toBe("Hello");
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("parses successful Translation API response", async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                data: { translations: [{ translatedText: "नमस्ते" }] },
            }),
        });
        const out = await translateText({ apiKey: "abc", text: "Hello", target: "hi" });
        expect(out).toBe("नमस्ते");
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("throws when API returns error JSON", async () => {
        fetchMock.mockResolvedValue({
            ok: false,
            statusText: "Bad",
            json: async () => ({ error: { message: "quota" } }),
        });
        await expect(translateText({ apiKey: "k", text: "Hi", target: "te" })).rejects.toThrow(/quota/);
    });
});
