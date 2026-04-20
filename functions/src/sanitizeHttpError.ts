/** Limit error detail length returned to HTTP clients (avoid leaking stack traces). */
export function sanitizeHttpErrorDetail(message: unknown, maxLen = 500): string {
    if (typeof message !== "string" || message.length === 0) {
        return "";
    }
    return message.length <= maxLen ? message : `${message.slice(0, maxLen)}…`;
}
