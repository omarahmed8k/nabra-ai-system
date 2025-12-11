import { db } from "./db";

// Get priority costs for a specific service type
export async function getPriorityCostsForService(serviceTypeId: string): Promise<{ low: number; medium: number; high: number }> {
  try {
    const serviceType = await db.serviceType.findUnique({
      where: { id: serviceTypeId },
      select: {
        priorityCostLow: true,
        priorityCostMedium: true,
        priorityCostHigh: true,
      },
    });

    if (serviceType) {
      return {
        low: serviceType.priorityCostLow,
        medium: serviceType.priorityCostMedium,
        high: serviceType.priorityCostHigh,
      };
    }
  } catch (error) {
    console.warn("Failed to fetch priority costs from service type, using defaults", error);
  }

  // Default values
  return { low: 0, medium: 1, high: 2 };
}

export async function calculateCreditCost(baseCost: number, priority: number, serviceTypeId: string): Promise<number> {
  const costs = await getPriorityCostsForService(serviceTypeId);
  const priorityCosts: Record<number, number> = { 1: costs.low, 2: costs.medium, 3: costs.high };
  const priorityCost = priorityCosts[priority] || costs.medium;
  return baseCost + priorityCost;
}

// Legacy function for backward compatibility - deprecated
export async function getPriorityCosts(): Promise<{ low: number; medium: number; high: number }> {
  console.warn("getPriorityCosts() is deprecated, use getPriorityCostsForService() instead");
  return { low: 0, medium: 1, high: 2 };
}

// No longer needed - priority costs are per service now
export function clearPriorityCostCache(): void {
  // Kept for backward compatibility but does nothing
}
