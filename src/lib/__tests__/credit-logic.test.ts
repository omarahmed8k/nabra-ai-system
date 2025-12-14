import { checkCredits, deductCredits, getCreditBalance } from "../credit-logic";

// Mock the database
jest.mock("../db", () => ({
  db: {
    clientSubscription: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe("Credit Logic", () => {
  const mockSubscription = {
    id: "sub-123",
    userId: "user-123",
    packageId: "pkg-123",
    remainingCredits: 10,
    isActive: true,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    createdAt: new Date(),
    updatedAt: new Date(),
    package: {
      id: "pkg-123",
      name: "Basic Plan",
      credits: 10,
      price: 100,
      duration: 30,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("checkCredits", () => {
    it("should return not allowed if no active subscription", async () => {
      const { db } = require("../db");
      db.clientSubscription.findFirst.mockResolvedValue(null);

      const result = await checkCredits("user-123", 1);

      expect(result.allowed).toBe(false);
      expect(result.remainingCredits).toBe(0);
      expect(result.message).toContain("subscription");
    });

    it("should return allowed if user has enough credits", async () => {
      const { db } = require("../db");
      db.clientSubscription.findFirst.mockResolvedValue(mockSubscription);

      const result = await checkCredits("user-123", 5);

      expect(result.allowed).toBe(true);
      expect(result.remainingCredits).toBe(10);
    });

    it("should return not allowed if user has insufficient credits", async () => {
      const { db } = require("../db");
      db.clientSubscription.findFirst.mockResolvedValue({
        ...mockSubscription,
        remainingCredits: 2,
      });

      const result = await checkCredits("user-123", 5);

      expect(result.allowed).toBe(false);
      expect(result.remainingCredits).toBe(2);
      expect(result.message).toContain("Insufficient");
    });

    it("should default to 1 credit if not specified", async () => {
      const { db } = require("../db");
      db.clientSubscription.findFirst.mockResolvedValue(mockSubscription);

      const result = await checkCredits("user-123");

      expect(result.allowed).toBe(true);
    });
  });

  describe("deductCredits", () => {
    it("should deduct credits successfully", async () => {
      const { db } = require("../db");
      db.clientSubscription.findFirst.mockResolvedValue(mockSubscription);
      db.clientSubscription.update.mockResolvedValue({
        ...mockSubscription,
        remainingCredits: 7,
      });

      const result = await deductCredits("user-123", 3, "Test deduction");

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(7);
      expect(db.clientSubscription.update).toHaveBeenCalledWith({
        where: { id: "sub-123" },
        data: { remainingCredits: 7 },
      });
    });

    it("should fail if no subscription found", async () => {
      const { db } = require("../db");
      db.clientSubscription.findFirst.mockResolvedValue(null);

      const result = await deductCredits("user-123", 3);

      expect(result.success).toBe(false);
      expect(result.message).toContain("No active subscription");
    });

    it("should fail if insufficient credits", async () => {
      const { db } = require("../db");
      db.clientSubscription.findFirst.mockResolvedValue({
        ...mockSubscription,
        remainingCredits: 2,
      });

      const result = await deductCredits("user-123", 5);

      expect(result.success).toBe(false);
      expect(result.message).toContain("Insufficient");
    });
  });

  describe("getCreditBalance", () => {
    it("should return credit balance", async () => {
      const { db } = require("../db");
      db.clientSubscription.findFirst.mockResolvedValue(mockSubscription);

      const result = await getCreditBalance("user-123");

      expect(result.balance).toBe(10);
      expect(result.subscription).not.toBeNull();
      expect(result.subscription?.packageName).toBe("Basic Plan");
    });

    it("should return 0 balance if no subscription", async () => {
      const { db } = require("../db");
      db.clientSubscription.findFirst.mockResolvedValue(null);

      const result = await getCreditBalance("user-123");

      expect(result.balance).toBe(0);
      expect(result.subscription).toBeNull();
    });
  });
});
