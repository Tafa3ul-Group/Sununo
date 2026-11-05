import { commissionOn, quoteDeposit } from "@/utils/deposit";

// Mirrors sununo-api src/bookings/utils/deposit.util.spec.ts — checkout must show
// the same deposit the API charges.
describe("quoteDeposit", () => {
  it("keeps percentage deposits as they were", () => {
    expect(quoteDeposit({ chalet: { depositPercentage: 25 }, totalPrice: 150_000 })).toEqual({
      offered: true, type: "percentage", percentage: 25, amount: 37_500,
    });
    expect(quoteDeposit({ chalet: { minDepositPercentage: "10.00" }, totalPrice: 200_000 }).amount).toBe(20_000);
    expect(quoteDeposit({ chalet: {}, totalPrice: 200_000 }).offered).toBe(false);
  });

  it("charges a fixed amount whatever the price", () => {
    const chalet = { depositType: "fixed", depositFixedAmount: "50000.00", depositPercentage: 25 };
    expect(quoteDeposit({ chalet, totalPrice: 300_000, originalPrice: 300_000 })).toEqual({
      offered: true, type: "fixed", percentage: null, amount: 50_000,
    });
  });

  it("raises a fixed amount to the commission on the price before discounts", () => {
    const chalet = {
      depositType: "fixed",
      depositFixedAmount: 10_000,
      depositCommission: { type: "percentage" as const, percentage: 10, fixedAmount: null },
    };
    // A coupon took the total to 150,000, but the commission is on 200,000.
    expect(quoteDeposit({ chalet, totalPrice: 150_000, originalPrice: 200_000 }).amount).toBe(20_000);
  });

  it("uses a fixed commission as the floor", () => {
    const chalet = {
      depositType: "fixed",
      depositFixedAmount: 5_000,
      depositCommission: { type: "fixed" as const, percentage: null, fixedAmount: 25_000 },
    };
    expect(quoteDeposit({ chalet, totalPrice: 300_000, originalPrice: 300_000 }).amount).toBe(25_000);
  });

  it("drops the deposit option once it reaches the total", () => {
    const chalet = { depositType: "fixed", depositFixedAmount: 50_000 };
    expect(quoteDeposit({ chalet, totalPrice: 50_000 }).offered).toBe(false);
    expect(quoteDeposit({ chalet, totalPrice: 45_000, originalPrice: 120_000 }).offered).toBe(false);
  });

  it("offers no fixed deposit without an amount", () => {
    expect(quoteDeposit({ chalet: { depositType: "fixed", depositFixedAmount: 0, depositPercentage: 20 }, totalPrice: 100_000 }).offered)
      .toBe(false);
  });
});

describe("commissionOn", () => {
  it("caps a fixed commission at the amount, like CommissionService", () => {
    expect(commissionOn(10_000, { type: "fixed", percentage: null, fixedAmount: 25_000 })).toBe(10_000);
    expect(commissionOn(200_000, { type: "percentage", percentage: 12.5, fixedAmount: null })).toBe(25_000);
    expect(commissionOn(200_000, null)).toBe(0);
  });
});
