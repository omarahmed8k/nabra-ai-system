import { db } from "@/lib/db";

export interface CreditCheckResult {
  allowed: boolean;
  remainingCredits: number;
  message?: string;
}

export interface CreditDeductionResult {
  success: boolean;
  newBalance: number;
  message?: string;
}

/**
 * Check if user has enough credits for an operation
 */
export async function checkCredits(
  userId: string,
  requiredCredits: number = 1
): Promise<CreditCheckResult> {
  const subscription = await db.clientSubscription.findFirst({
    where: {
      userId,
      isActive: true,
      endDate: { gte: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!subscription) {
    return {
      allowed: false,
      remainingCredits: 0,
      message: "No active subscription found. Please subscribe to a package.",
    };
  }

  if (subscription.remainingCredits < requiredCredits) {
    return {
      allowed: false,
      remainingCredits: subscription.remainingCredits,
      message: `Insufficient credits. You have ${subscription.remainingCredits} credits but need ${requiredCredits}.`,
    };
  }

  return {
    allowed: true,
    remainingCredits: subscription.remainingCredits,
  };
}

/**
 * Deduct credits from user's subscription
 */
export async function deductCredits(
  userId: string,
  credits: number = 1,
  reason?: string
): Promise<CreditDeductionResult> {
  const subscription = await db.clientSubscription.findFirst({
    where: {
      userId,
      isActive: true,
      endDate: { gte: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!subscription) {
    return {
      success: false,
      newBalance: 0,
      message: "No active subscription found.",
    };
  }

  if (subscription.remainingCredits < credits) {
    return {
      success: false,
      newBalance: subscription.remainingCredits,
      message: "Insufficient credits.",
    };
  }

  const updatedSubscription = await db.clientSubscription.update({
    where: { id: subscription.id },
    data: {
      remainingCredits: subscription.remainingCredits - credits,
    },
  });

  // Log the transaction (optional - could create a CreditTransaction table)
  console.log(`[CREDIT] Deducted ${credits} from user ${userId}. Reason: ${reason || "N/A"}`);

  return {
    success: true,
    newBalance: updatedSubscription.remainingCredits,
    message: `Successfully deducted ${credits} credit(s).`,
  };
}

/**
 * Combined check and deduct credits in a single operation
 * Optimized to avoid duplicate database queries
 */
export async function checkAndDeductCredits(
  userId: string,
  credits: number = 1,
  reason?: string
): Promise<CreditDeductionResult & { allowed: boolean }> {
  const subscription = await db.clientSubscription.findFirst({
    where: {
      userId,
      isActive: true,
      endDate: { gte: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!subscription) {
    return {
      success: false,
      allowed: false,
      newBalance: 0,
      message: "No active subscription found. Please subscribe to a package.",
    };
  }

  if (subscription.remainingCredits < credits) {
    return {
      success: false,
      allowed: false,
      newBalance: subscription.remainingCredits,
      message: `Insufficient credits. You have ${subscription.remainingCredits} credits but need ${credits}.`,
    };
  }

  const updatedSubscription = await db.clientSubscription.update({
    where: { id: subscription.id },
    data: {
      remainingCredits: subscription.remainingCredits - credits,
    },
  });

  console.log(`[CREDIT] Deducted ${credits} from user ${userId}. Reason: ${reason || "N/A"}`);

  return {
    success: true,
    allowed: true,
    newBalance: updatedSubscription.remainingCredits,
    message: `Successfully deducted ${credits} credit(s).`,
  };
}

/**
 * Add credits to user's subscription (e.g., for refunds or bonuses)
 */
export async function addCredits(
  userId: string,
  credits: number,
  reason?: string
): Promise<CreditDeductionResult> {
  const subscription = await db.clientSubscription.findFirst({
    where: {
      userId,
      isActive: true,
      endDate: { gte: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!subscription) {
    return {
      success: false,
      newBalance: 0,
      message: "No active subscription found.",
    };
  }

  const updatedSubscription = await db.clientSubscription.update({
    where: { id: subscription.id },
    data: {
      remainingCredits: subscription.remainingCredits + credits,
    },
  });

  console.log(`[CREDIT] Added ${credits} to user ${userId}. Reason: ${reason || "N/A"}`);

  return {
    success: true,
    newBalance: updatedSubscription.remainingCredits,
    message: `Successfully added ${credits} credit(s).`,
  };
}

/**
 * Get user's current credit balance
 */
export async function getCreditBalance(userId: string): Promise<{
  balance: number;
  subscription: {
    packageName: string;
    endDate: Date;
  } | null;
}> {
  const subscription = await db.clientSubscription.findFirst({
    where: {
      userId,
      isActive: true,
      endDate: { gte: new Date() },
    },
    include: {
      package: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!subscription) {
    return {
      balance: 0,
      subscription: null,
    };
  }

  return {
    balance: subscription.remainingCredits,
    subscription: {
      packageName: subscription.package.name,
      endDate: subscription.endDate,
    },
  };
}

/**
 * Check if subscription is about to expire (within 7 days)
 */
export async function checkSubscriptionExpiry(userId: string): Promise<{
  isExpiring: boolean;
  daysRemaining: number;
}> {
  const subscription = await db.clientSubscription.findFirst({
    where: {
      userId,
      isActive: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!subscription) {
    return { isExpiring: true, daysRemaining: 0 };
  }

  const now = Date.now();
  const endDate = new Date(subscription.endDate).getTime();
  const diffTime = endDate - now;
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    isExpiring: daysRemaining <= 7,
    daysRemaining: Math.max(0, daysRemaining),
  };
}
