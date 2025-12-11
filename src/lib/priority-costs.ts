import { db } from "./db";

// Cache for priority costs to avoid repeated DB queries
let cachedPriorityCosts: { low: number; medium: number; high: number } | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getPriorityCosts(): Promise<{ low: number; medium: number; high: number }> {
  const now = Date.now();
  
  // Return cached value if still valid
  if (cachedPriorityCosts && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedPriorityCosts;
  }

  try {
    const setting = await db.systemSettings.findUnique({
      where: { key: "priority_costs" },
    });

    if (setting?.value) {
      cachedPriorityCosts = setting.value as { low: number; medium: number; high: number };
      lastFetchTime = now;
      return cachedPriorityCosts;
    }
  } catch (error) {
    // If DB query fails or table doesn't exist yet, return defaults
    console.warn("Failed to fetch priority costs from DB, using defaults", error);
  }

  // Default values
  const defaults = { low: 0, medium: 1, high: 2 };
  cachedPriorityCosts = defaults;
  lastFetchTime = now;
  return defaults;
}

export async function calculateCreditCost(baseCost: number, priority: number): Promise<number> {
  const costs = await getPriorityCosts();
  const priorityCosts: Record<number, number> = { 1: costs.low, 2: costs.medium, 3: costs.high };
  const priorityCost = priorityCosts[priority] || costs.medium;
  return baseCost + priorityCost;
}

// Clear cache (useful for testing or after settings update)
export function clearPriorityCostCache(): void {
  cachedPriorityCosts = null;
  lastFetchTime = 0;
}
