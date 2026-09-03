import {
  allocateWithdrawalAmounts,
  calculateProviderFinance,
  normalizePayoutDetails,
} from "@/lib/provider-wallet";

describe("provider wallet finance calculation", () => {
  it("credits 100% of request credits to the provider", () => {
    expect(calculateProviderFinance(200, 1)).toMatchObject({
      providerCredits: 200,
      providerAmountEgp: 200,
      totalAmountEgp: 200,
    });

    expect(calculateProviderFinance(50, 2)).toMatchObject({
      providerCredits: 50,
      providerAmountEgp: 100,
      totalAmountEgp: 100,
    });
  });

  it("converts provider credits to EGP using the service credit price", () => {
    expect(calculateProviderFinance(100, 1)).toMatchObject({
      providerCredits: 100,
      providerAmountEgp: 100,
      totalAmountEgp: 100,
    });

    expect(calculateProviderFinance(100, 2)).toMatchObject({
      providerCredits: 100,
      providerAmountEgp: 200,
      totalAmountEgp: 200,
    });
  });

  it("rounds EGP amounts to two decimals", () => {
    expect(calculateProviderFinance(3, 1.333)).toMatchObject({
      providerCredits: 3,
      providerAmountEgp: 4,
      totalAmountEgp: 4,
    });
  });
});

describe("payout details", () => {
  it("requires bank name and account number for bank payouts", () => {
    expect(
      normalizePayoutDetails({
        payoutMethod: "BANK",
        accountHolder: " Omar Ali ",
        bankName: " CIB ",
        bankAccount: " EG123 ",
      })
    ).toEqual({
      payoutMethod: "BANK",
      accountHolder: "Omar Ali",
      bankName: "CIB",
      bankAccount: "EG123",
      eWalletNumber: null,
    });

    expect(() =>
      normalizePayoutDetails({
        payoutMethod: "BANK",
        accountHolder: "Omar Ali",
        bankName: "CIB",
        bankAccount: "",
      })
    ).toThrow("Bank name and account number are required for bank payouts");
  });

  it("requires an e-wallet number for e-wallet payouts", () => {
    expect(
      normalizePayoutDetails({
        payoutMethod: "E_WALLET",
        accountHolder: "Omar Ali",
        eWalletNumber: " 01000000000 ",
      })
    ).toEqual({
      payoutMethod: "E_WALLET",
      accountHolder: "Omar Ali",
      bankName: null,
      bankAccount: null,
      eWalletNumber: "01000000000",
    });

    expect(() =>
      normalizePayoutDetails({
        payoutMethod: "E_WALLET",
        accountHolder: "Omar Ali",
        eWalletNumber: " ",
      })
    ).toThrow("E-wallet number is required for e-wallet payouts");
  });
});

describe("withdrawal allocation", () => {
  it("withdraws remaining credits when the full EGP balance is requested", () => {
    expect(allocateWithdrawalAmounts(150, 150, 80)).toEqual({
      amountEgp: 150,
      amountCredits: 80,
    });
  });

  it("allocates credits proportionally for a partial withdrawal", () => {
    expect(allocateWithdrawalAmounts(50, 200, 40)).toEqual({
      amountEgp: 50,
      amountCredits: 10,
    });
  });

  it("rejects amounts below 1 EGP or above the available balance", () => {
    expect(() => allocateWithdrawalAmounts(0.4, 100, 10)).toThrow(
      "Minimum withdrawal amount is 1 EGP"
    );
    expect(() => allocateWithdrawalAmounts(120, 100, 10)).toThrow(
      "Withdrawal amount exceeds available balance"
    );
    expect(() => allocateWithdrawalAmounts(10, 0, 0)).toThrow("Insufficient wallet balance");
  });
});
