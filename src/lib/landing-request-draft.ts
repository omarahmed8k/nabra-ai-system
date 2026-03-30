/** Session draft for hero → register → login → new client request flow (same tab). */
export const PENDING_REQUEST_DESCRIPTION_KEY = "nabra_pending_request_description";

/** Safe post-auth path we allow from ?continue= (avoid open redirects). */
export const CONTINUE_NEW_REQUEST_PATH = "/client/requests/new";

export function setPendingRequestDescription(text: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(PENDING_REQUEST_DESCRIPTION_KEY, text);
  } catch {
    /* quota / private mode */
  }
}

export function getPendingRequestDescription(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(PENDING_REQUEST_DESCRIPTION_KEY);
  } catch {
    return null;
  }
}

export function clearPendingRequestDescription(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(PENDING_REQUEST_DESCRIPTION_KEY);
  } catch {
    /* ignore */
  }
}

export function parseContinuePath(param: string | null): string | null {
  if (!param) return null;
  const decoded = decodeURIComponent(param);
  if (decoded === CONTINUE_NEW_REQUEST_PATH) return CONTINUE_NEW_REQUEST_PATH;
  return null;
}
