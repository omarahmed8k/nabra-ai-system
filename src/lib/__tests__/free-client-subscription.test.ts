import { assignFreeClientSubscription } from "@/lib/free-client-subscription";

describe("assignFreeClientSubscription", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-06-25T12:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("creates an active free subscription for the client", async () => {
    const db = {
      package: {
        findFirst: jest.fn().mockResolvedValue({
          id: "free-package",
          credits: 10,
          durationDays: 30,
        }),
      },
      clientSubscription: {
        create: jest.fn().mockResolvedValue({ id: "subscription-1" }),
      },
    };

    const typedDb = db as unknown as Parameters<typeof assignFreeClientSubscription>[0];

    await expect(assignFreeClientSubscription(typedDb, "client-1")).resolves.toEqual({
      id: "subscription-1",
    });

    expect(db.package.findFirst).toHaveBeenCalledWith({
      where: {
        isFreePackage: true,
        isActive: true,
      },
    });
    expect(db.clientSubscription.create).toHaveBeenCalledWith({
      data: {
        userId: "client-1",
        packageId: "free-package",
        remainingCredits: 10,
        startDate: new Date("2026-06-25T12:00:00.000Z"),
        endDate: new Date("2026-07-25T12:00:00.000Z"),
        isActive: true,
        isFreeTrialUsed: true,
      },
    });
  });

  it("does nothing when no active free package exists", async () => {
    const db = {
      package: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      clientSubscription: {
        create: jest.fn(),
      },
    };

    const typedDb = db as unknown as Parameters<typeof assignFreeClientSubscription>[0];

    await expect(assignFreeClientSubscription(typedDb, "client-1")).resolves.toBeNull();
    expect(db.clientSubscription.create).not.toHaveBeenCalled();
  });
});
