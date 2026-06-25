import type { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";

type TransactionClient = Prisma.TransactionClient;

function roundEgp(amount: number) {
  return Math.round(amount * 100) / 100;
}

export function calculateProviderFinance(totalCredits: number, creditPriceEgp: number) {
  const normalizedCreditPriceEgp = Math.max(0, creditPriceEgp);
  const totalAmountEgp = roundEgp(totalCredits * normalizedCreditPriceEgp);

  return {
    providerCredits: totalCredits,
    creditPriceEgp: normalizedCreditPriceEgp,
    totalAmountEgp,
    providerAmountEgp: totalAmountEgp,
  };
}

export async function getOrCreateProviderWallet(tx: TransactionClient, providerId: string) {
  return tx.providerWallet.upsert({
    where: { providerId },
    update: {},
    create: { providerId },
  });
}

export async function settleCompletedRequest(tx: TransactionClient, requestId: string) {
  const existingLedger = await tx.providerFinanceLedger.findUnique({
    where: { requestId },
  });

  if (existingLedger) {
    return existingLedger;
  }

  const request = await tx.request.findUnique({
    where: { id: requestId },
    include: {
      serviceType: true,
    },
  });

  if (!request) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Request not found",
    });
  }

  if (!request.providerId) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Cannot settle provider finance without an assigned provider",
    });
  }

  const finance = calculateProviderFinance(
    request.creditCost,
    request.serviceType.creditPriceEgp ?? 1
  );

  await getOrCreateProviderWallet(tx, request.providerId);

  const ledger = await tx.providerFinanceLedger.create({
    data: {
      requestId,
      providerId: request.providerId,
      serviceTypeId: request.serviceTypeId,
      totalCredits: request.creditCost,
      providerCredits: finance.providerCredits,
      creditPriceEgp: finance.creditPriceEgp,
      totalAmountEgp: finance.totalAmountEgp,
      providerAmountEgp: finance.providerAmountEgp,
      status: "AVAILABLE",
      settledAt: new Date(),
    },
  });

  await tx.providerWallet.update({
    where: { providerId: request.providerId },
    data: {
      balanceCredits: {
        increment: finance.providerCredits,
      },
      balanceEgp: {
        increment: finance.providerAmountEgp,
      },
    },
  });

  return ledger;
}
