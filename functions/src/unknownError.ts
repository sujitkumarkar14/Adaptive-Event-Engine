/**
 * Coerce caught values to a string safe for logs and HTTP audit fields without using `any`.
 */
export function stringifyCaught(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "object" && e !== null && "message" in e) {
    const m = (e as { message: unknown }).message;
    if (typeof m === "string") return m;
  }
  return String(e);
}

/** Prefer {@link Error#message} when present; useful for capacity / Spanner errors. */
export function errorMessageOrEmpty(e: unknown): string {
  if (e instanceof Error) return e.message;
  return "";
}
