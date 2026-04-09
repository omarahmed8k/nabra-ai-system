const ACTIVE_REQUEST_STATUSES = new Set([
  "PENDING",
  "IN_PROGRESS",
  "REVISION_REQUESTED",
  "DELIVERED",
]);

const REQUEST_THREAD_POLLING_INTERVAL_MS = 4000;

export function getRequestThreadPollingInterval(status: unknown): number | false {
  if (typeof status !== "string") return REQUEST_THREAD_POLLING_INTERVAL_MS;
  if (ACTIVE_REQUEST_STATUSES.has(status)) return REQUEST_THREAD_POLLING_INTERVAL_MS;
  return false;
}
