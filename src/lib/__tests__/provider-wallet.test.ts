import { calculateProviderFinance } from "@/lib/provider-wallet";

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
