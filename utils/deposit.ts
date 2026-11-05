/**
 * The deposit (العربون) checkout shows — a mirror of `resolveDeposit` in
 * sununo-api (src/bookings/utils/deposit.util.ts). The API re-prices it when
 * the booking is created; this exists so the screen shows the same figure.
 *
 *   percentage — depositPercentage (falling back to minDepositPercentage) of
 *                what the customer pays after discounts. Unchanged.
 *   fixed      — depositFixedAmount, raised to the platform commission on the
 *                price BEFORE discounts, and no deposit at all (a full payment)
 *                once it reaches the total.
 */

export type DepositType = "percentage" | "fixed";

/** The commission rule the API raises a fixed deposit to (`chalet.depositCommission`). */
export interface DepositCommission {
  type: "fixed" | "percentage";
  percentage: number | null;
  fixedAmount: number | null;
}

export interface DepositChaletLike {
  depositType?: string | null;
  depositPercentage?: number | string | null;
  minDepositPercentage?: number | string | null;
  depositFixedAmount?: number | string | null;
  depositCommission?: DepositCommission | null;
}

export interface DepositQuote {
  /** Whether the customer can pay a deposit on this booking. */
  offered: boolean;
  type: DepositType;
  /** Set for percentage deposits, for the "(25%)" label. */
  percentage: number | null;
  /** What paying a deposit charges now. 0 when not offered. */
  amount: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export const depositTypeOf = (chalet?: DepositChaletLike | null): DepositType =>
  chalet?.depositType === "fixed" ? "fixed" : "percentage";

/** Commission on `amount`, the same way CommissionService prices it. */
export const commissionOn = (amount: number, rule?: DepositCommission | null): number => {
  if (!rule || !(amount > 0)) return 0;
  if (rule.type === "fixed") return Math.min(Number(rule.fixedAmount) || 0, amount);
  return round2((amount * (Number(rule.percentage) || 0)) / 100);
};

export function quoteDeposit(input: {
  chalet?: DepositChaletLike | null;
  /** What the customer pays, after discounts and coupons. */
  totalPrice: number;
  /** The price before any discount — what the commission is priced on. */
  originalPrice?: number;
}): DepositQuote {
  const chalet = input.chalet;
  const totalPrice = Math.max(0, Number(input.totalPrice) || 0);
  const type = depositTypeOf(chalet);

  if (type === "fixed") {
    const fixed = Number(chalet?.depositFixedAmount) || 0;
    if (!(fixed > 0)) return { offered: false, type, percentage: null, amount: 0 };
    const original = Number(input.originalPrice) > 0 ? Number(input.originalPrice) : totalPrice;
    const amount = round2(Math.max(fixed, commissionOn(original, chalet?.depositCommission)));
    if (amount >= totalPrice) return { offered: false, type, percentage: null, amount: 0 };
    return { offered: true, type, percentage: null, amount };
  }

  const percentage = Number(chalet?.depositPercentage) || Number(chalet?.minDepositPercentage) || 0;
  if (!(percentage > 0)) return { offered: false, type, percentage: 0, amount: 0 };
  // Whole dinars, as checkout has always shown it.
  return { offered: true, type, percentage, amount: Math.round((totalPrice * percentage) / 100) };
}
