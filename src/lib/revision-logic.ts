import { db } from "@/lib/db";
import { deductCredits } from "@/lib/credit-logic";
import { notifyStatusChange } from "@/lib/notifications";
import { getTranslation } from "@/lib/notifications/i18n-helper";

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
  userId: string,
  locale = "en"
): Promise<RevisionResult> {
  // Step 1: Get the request with its service type
  const request = await db.request.findUnique({
    where: { id: requestId },
    include: {
      client: true,
      serviceType: true,
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

  // Read all revision settings from the service type (current values)
  const maxFreeRevisions = request.serviceType.maxFreeRevisions;
  const currentCount = request.currentRevisionCount;
  const paidRevisionCost = request.serviceType.paidRevisionCost;
  const resetFreeRevisionsOnPaid = request.serviceType.resetFreeRevisionsOnPaid;

  // Step 3: Check if this revision is free
  if (currentCount < maxFreeRevisions) {
    // FREE REVISION - just increment counter
    const updatedRequest = await db.request.update({
      where: { id: requestId },
      data: {
        currentRevisionCount: currentCount + 1,
        totalRevisions: request.totalRevisions + 1,
        status: "REVISION_REQUESTED",
        isRevision: true,
        revisionType: "free",
      },
    });

    // Create system comment for tracking
    const freeRevisionComment = await getTranslation(
      locale,
      "requests.messages.systemMessages.revisionRequestedFree",
      {
        used: currentCount + 1,
        max: maxFreeRevisions,
      }
    );
    await db.requestComment.create({
      data: {
        requestId,
        userId,
        content: freeRevisionComment,
        type: "SYSTEM",
      },
    });

    // Notify provider
    if (request.providerId) {
      // Send realtime + email notification
      await notifyStatusChange({
        requestId,
        userId: request.providerId,
        oldStatus: "DELIVERED",
        newStatus: "REVISION_REQUESTED",
        locale,
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
  if (subscription.remainingCredits < paidRevisionCost) {
    return {
      allowed: false,
      isFree: false,
      creditCost: paidRevisionCost,
      newRevisionCount: currentCount,
      message: `You've used all ${maxFreeRevisions} free revisions. Additional revisions cost ${paidRevisionCost} ${paidRevisionCost === 1 ? "credit" : "credits"}, but you have ${subscription.remainingCredits} credits remaining. Please purchase more credits.`,
    };
  }

  // Deduct credits for paid revision
  const deductResult = await deductCredits(
    userId,
    paidRevisionCost,
    `Paid revision for request: ${request.title}`
  );

  if (!deductResult.success) {
    return {
      allowed: false,
      isFree: false,
      creditCost: paidRevisionCost,
      newRevisionCount: currentCount,
      message: deductResult.message || "Failed to deduct credits.",
    };
  }

  // Update request - conditionally RESET counter based on package settings
  const newRevisionCount = resetFreeRevisionsOnPaid ? 0 : currentCount;
  const updatedRequest = await db.request.update({
    where: { id: requestId },
    data: {
      currentRevisionCount: newRevisionCount, // Reset to 0 if package allows, otherwise keep count
      totalRevisions: request.totalRevisions + 1,
      status: "REVISION_REQUESTED",
      isRevision: true,
      revisionType: "paid",
      creditCost: request.creditCost + paidRevisionCost, // Accumulate the paid revision cost
    },
  });

  // Create system comment
  const resetNote = await getTranslation(
    locale,
    resetFreeRevisionsOnPaid
      ? "requests.messages.systemMessages.revisionPaidCounterReset"
      : "requests.messages.systemMessages.revisionPaidCounterNotReset",
    resetFreeRevisionsOnPaid ? { max: maxFreeRevisions } : undefined
  );

  const creditUnit = await getTranslation(
    locale,
    paidRevisionCost === 1 ? "requests.header.credit" : "requests.header.credits"
  );

  const paidRevisionComment = await getTranslation(
    locale,
    "requests.messages.systemMessages.revisionRequestedPaid",
    {
      cost: paidRevisionCost,
      creditUnit,
      resetNote,
    }
  );

  await db.requestComment.create({
    data: {
      requestId,
      userId,
      content: paidRevisionComment,
      type: "SYSTEM",
    },
  });

  // Notify provider
  if (request.providerId) {
    // Send realtime + email notification
    await notifyStatusChange({
      requestId,
      userId: request.providerId,
      oldStatus: "DELIVERED",
      newStatus: "REVISION_REQUESTED",
      locale,
    });
  }

  return {
    allowed: true,
    isFree: false,
    creditCost: paidRevisionCost,
    newRevisionCount: updatedRequest.currentRevisionCount,
    message: buildPaidRevisionMessage(
      paidRevisionCost,
      maxFreeRevisions,
      resetFreeRevisionsOnPaid,
      deductResult.newBalance
    ),
  };
}

function buildPaidRevisionMessage(
  cost: number,
  maxFree: number,
  reset: boolean,
  balance: number
): string {
  const creditText = cost === 1 ? "credit" : "credits";
  const baseMessage = `Paid revision requested (${cost} ${creditText} deducted).`;

  if (reset) {
    return `${baseMessage} Your free revision counter has been reset - you now have ${maxFree} free revisions available again. Credits remaining: ${balance}`;
  }

  return `${baseMessage} Note: Free revision counter was NOT reset. Credits remaining: ${balance}`;
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
    include: {
      serviceType: true,
    },
  });

  if (request?.clientId !== userId) {
    return {
      currentCount: 0,
      maxFree: 0,
      totalRevisions: 0,
      nextRevisionCost: 0,
      freeRevisionsRemaining: 0,
    };
  }

  // Read all revision settings from the service type (current values)
  const maxFree = request.serviceType.maxFreeRevisions;
  const paidCost = request.serviceType.paidRevisionCost;
  const currentCount = request.currentRevisionCount;
  const freeRevisionsRemaining = Math.max(0, maxFree - currentCount);
  const nextRevisionCost = freeRevisionsRemaining > 0 ? 0 : paidCost;

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
export async function isRevisionFree(requestId: string, userId: string): Promise<boolean> {
  const info = await getRevisionInfo(requestId, userId);
  return info.freeRevisionsRemaining > 0;
}
