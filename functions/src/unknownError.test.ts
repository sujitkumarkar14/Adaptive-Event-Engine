import { describe, it, expect } from "vitest";
import { errorMessageOrEmpty, stringifyCaught } from "./unknownError";

describe("unknownError", () => {
  it("stringifyCaught uses Error.message", () => {
    expect(stringifyCaught(new Error("Spanner ABORTED"))).toBe("Spanner ABORTED");
  });

  it("stringifyCaught handles non-Error objects with message", () => {
    expect(stringifyCaught({ message: "contention" })).toBe("contention");
  });

  it("errorMessageOrEmpty returns empty for unknown shapes", () => {
    expect(errorMessageOrEmpty("timeout")).toBe("");
  });
});
