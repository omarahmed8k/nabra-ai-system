import { db } from "@/lib/db";
import { deductCredits } from "@/lib/credit-logic";

export interface RevisionResult {
  allowed: boolean;
  isFree: boolean;
  creditCost: number;
  newRevisionCount: number;
  message: string;
}

/**
 * Smart Revision Algorithm
 * 
 * This is the core algorithm for handling revision requests:
 * 
 * 1. Get the request and active subscription
 * 2. Check current revision count vs. max free revisions from package
 * 3. IF count < max: Allow FREE revision, increment counter
 * 4. ELSE (count >= max): Check if client has credits
 *    - IF yes: Deduct 1 credit, RESET counter to 0
 *    - IF no: Block revision
 * 
 * Key Innovation: Counter resets after paid revision!
 * This allows clients to get free revisions again after paying.
 * 
 * Example with 3 free revisions:
 * Request created → Delivered
 * - Revision 1: Free (count=1) ✅
 * - Revision 2: Free (count=2) ✅
 * - Revision 3: Free (count=3) ✅
 * - Revision 4: Paid (count=0, -1 credit) 💳 COUNTER RESET!
 * - Revision 5: Free (count=1) ✅
 * - Revision 6: Free (count=2) ✅
 * - Revision 7: Free (count=3) ✅
 * - Revision 8: Paid (count=0, -1 credit) 💳 COUNTER RESET!
 */
export async function handleRevisionRequest(
  requestId: string,
  userId: string
): Promise<RevisionResult> {
  // Step 1: Get the request
  const request = await db.request.findUnique({
    where: { id: requestId },
    include: {
      client: true,
    },
  });

  if (!request) {
    return {
      allowed: false,
      isFree: false,
      creditCost: 0,
      newRevisionCount: 0,
      message: "Request not found.",
    };
  }

  // Verify the user is the client
  if (request.clientId !== userId) {
    return {
      allowed: false,
      isFree: false,
      creditCost: 0,
      newRevisionCount: 0,
      message: "Only the request owner can request revisions.",
    };
  }

  // Check request status - must be DELIVERED
  if (request.status !== "DELIVERED") {
    return {
      allowed: false,
      isFree: false,
      creditCost: 0,
      newRevisionCount: request.currentRevisionCount,
      message: "Revisions can only be requested for delivered work.",
    };
  }

  // Step 2: Get active subscription with package details
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
      allowed: false,
      isFree: false,
      creditCost: 0,
      newRevisionCount: request.currentRevisionCount,
      message: "No active subscription. Please subscribe to request revisions.",
    };
  }

  const maxFreeRevisions = subscription.package.maxFreeRevisions;
  const currentCount = request.currentRevisionCount;

  // Step 3: Check if this revision is free
  if (currentCount < maxFreeRevisions) {
    // FREE REVISION - just increment counter
    const updatedRequest = await db.request.update({
      where: { id: requestId },
      data: {
        currentRevisionCount: currentCount + 1,
        totalRevisions: request.totalRevisions + 1,
        status: "REVISION_REQUESTED",
      },
    });

    // Create system comment for tracking
    await db.requestComment.create({
      data: {
        requestId,
        userId,
        content: `Revision requested (${currentCount + 1}/${maxFreeRevisions} free revisions used)`,
        type: "SYSTEM",
      },
    });

    // Notify provider
    if (request.providerId) {
      await db.notification.create({
        data: {
          userId: request.providerId,
          title: "Revision Requested",
          message: `Client requested a revision for "${request.title}"`,
          type: "request",
          link: `/provider/requests/${requestId}`,
        },
      });
    }

    return {
      allowed: true,
      isFree: true,
      creditCost: 0,
      newRevisionCount: updatedRequest.currentRevisionCount,
      message: `Free revision requested (${currentCount + 1}/${maxFreeRevisions} used). Provider will be notified.`,
    };
  }

  // Step 4: Paid revision - check credits
  if (subscription.remainingCredits < 1) {
    return {
      allowed: false,
      isFree: false,
      creditCost: 1,
      newRevisionCount: currentCount,
      message: `You've used all ${maxFreeRevisions} free revisions. Additional revisions cost 1 credit, but you have 0 credits remaining. Please purchase more credits.`,
    };
  }

  // Deduct credit and RESET counter
  const deductResult = await deductCredits(
    userId,
    1,
    `Paid revision for request: ${request.title}`
  );

  if (!deductResult.success) {
    return {
      allowed: false,
      isFree: false,
      creditCost: 1,
      newRevisionCount: currentCount,
      message: deductResult.message || "Failed to deduct credits.",
    };
  }

  // Update request - RESET counter to 0!
  const updatedRequest = await db.request.update({
    where: { id: requestId },
    data: {
        currentRevisionCount: 0, // RESET!
        totalRevisions: request.totalRevisions + 1,
        status: "REVISION_REQUESTED",
    },
  });

  // Create system comment
  await db.requestComment.create({
    data: {
      requestId,
      userId,
      content: `Paid revision requested (1 credit used). Free revision counter reset - you now have ${maxFreeRevisions} free revisions available again.`,
      type: "SYSTEM",
    },
  });

  // Notify provider
  if (request.providerId) {
    await db.notification.create({
      data: {
        userId: request.providerId,
        title: "Revision Requested",
        message: `Client requested a paid revision for "${request.title}"`,
        type: "request",
        link: `/provider/requests/${requestId}`,
      },
    });
  }

  return {
    allowed: true,
    isFree: false,
    creditCost: 1,
    newRevisionCount: updatedRequest.currentRevisionCount,
    message: `Paid revision requested (1 credit deducted). Your free revision counter has been reset - you now have ${maxFreeRevisions} free revisions available again. Credits remaining: ${deductResult.newBalance}`,
  };
}

/**
 * Get revision info for a request
 */
export async function getRevisionInfo(
  requestId: string,
  userId: string
): Promise<{
  currentCount: number;
  maxFree: number;
  totalRevisions: number;
  nextRevisionCost: number;
  freeRevisionsRemaining: number;
}> {
  const request = await db.request.findUnique({
    where: { id: requestId },
  });

  if (!request || request.clientId !== userId) {
    return {
      currentCount: 0,
      maxFree: 0,
      totalRevisions: 0,
      nextRevisionCost: 0,
      freeRevisionsRemaining: 0,
    };
  }

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

  const maxFree = subscription?.package.maxFreeRevisions || 0;
  const currentCount = request.currentRevisionCount;
  const freeRevisionsRemaining = Math.max(0, maxFree - currentCount);
  const nextRevisionCost = freeRevisionsRemaining > 0 ? 0 : 1;

  return {
    currentCount,
    maxFree,
    totalRevisions: request.totalRevisions,
    nextRevisionCost,
    freeRevisionsRemaining,
  };
}

/**
 * Check if revision request would be free
 */
export async function isRevisionFree(
  requestId: string,
  userId: string
): Promise<boolean> {
  const info = await getRevisionInfo(requestId, userId);
  return info.freeRevisionsRemaining > 0;
}
