/** Logs only in Vite dev — avoids leaking venue IDs, device IDs, or user hints in production consoles. */
export function devLog(...args: unknown[]): void {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console -- intentional dev-only diagnostics
    console.log(...args);
  }
}

export function devWarn(...args: unknown[]): void {
  if (import.meta.env.DEV) {
    console.warn(...args);
  }
}
