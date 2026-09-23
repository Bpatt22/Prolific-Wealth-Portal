// Errors thrown by our GHL client are real Error instances, but Supabase's
// postgrest-js throws plain objects ({message, details, hint, code}) which
// String()/JSON.stringify(Error) both mangle into "[object Object]". This
// pulls out whatever fields are actually there so admin error responses are
// useful instead of opaque.
export function serializeError(err: unknown): string {
  if (err instanceof Error) return `${err.message}\n${err.stack ?? ""}`;
  if (err && typeof err === "object") {
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }
  return String(err);
}
