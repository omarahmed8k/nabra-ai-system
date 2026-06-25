import type { PrismaClient } from "@prisma/client";

type FreeClientSubscriptionDb = Pick<PrismaClient, "package" | "clientSubscription">;

export async function assignFreeClientSubscription(db: FreeClientSubscriptionDb, userId: string) {
  const freePackage = await db.package.findFirst({
    where: {
      isFreePackage: true,
      isActive: true,
    },
  });

  if (!freePackage) {
    return null;
  }

  const now = new Date();
  const endDate = new Date(Date.now() + freePackage.durationDays * 24 * 60 * 60 * 1000);

  return db.clientSubscription.create({
    data: {
      userId,
      packageId: freePackage.id,
      remainingCredits: freePackage.credits,
      startDate: now,
      endDate,
      isActive: true,
      isFreeTrialUsed: true,
    },
  });
}
