/**
 * The words for a chalet's cancellation tiers, shared by the owner's preview
 * ("هكذا يراها الزبون") and the customer's checkout card so the two can never
 * say different things.
 *
 * Tiers are applied the way CancellationProcessingService does it: the tier
 * used is the one with the largest `days` that is still <= the days left, and
 * with no matching tier the whole amount is kept.
 */

export type PolicyTier = { days: number; fee: number };

export type PolicyLine = {
  /** "قبل 7 يوم أو أكثر" / "قبل 3 إلى 6 يوم" / "في يوم الحجز نفسه" / "أقل من 3 يوم" */
  range: string;
  /** "يُسترجع كامل المبلغ المدفوع" / "رسوم 50% من قيمة الحجز" / "لا يُسترجع أي مبلغ" */
  outcome: string;
  /** Nothing comes back in this window. */
  noRefund: boolean;
  /** The tier this line describes; null for the trailing "too late" line. */
  tier: PolicyTier | null;
};

const outcomeText = (fee: number, isRTL: boolean) => {
  if (fee <= 0) return isRTL ? 'يُسترجع كامل المبلغ المدفوع' : 'Full refund of what was paid';
  if (fee >= 100) return isRTL ? 'لا يُسترجع أي مبلغ' : 'No refund';
  return isRTL ? `رسوم ${fee}% من قيمة الحجز` : `${fee}% of the booking price is kept`;
};

/** `tiers` must be sorted farthest-first (largest `days` first). */
export function describeCancellationTiers(tiers: PolicyTier[], isRTL: boolean): PolicyLine[] {
  const lines: PolicyLine[] = tiers.map((tier, i) => {
    const { days, fee } = tier;
    let range: string;
    if (days === 0) range = isRTL ? 'في يوم الحجز نفسه' : 'On the booking day';
    else if (i === 0) range = isRTL ? `قبل ${days} يوم أو أكثر` : `${days}+ days before`;
    else {
      const upper = tiers[i - 1].days - 1;
      range = upper === days
        ? (isRTL ? `قبل ${days} يوم` : `${days} days before`)
        : (isRTL ? `قبل ${days} إلى ${upper} يوم` : `${days}–${upper} days before`);
    }
    return { range, outcome: outcomeText(fee, isRTL), noRefund: fee >= 100, tier };
  });

  const smallest = tiers.length ? tiers[tiers.length - 1].days : null;
  if (smallest !== 0) {
    lines.push({
      range: smallest === null
        ? (isRTL ? 'في أي وقت' : 'Any time')
        : (isRTL ? `أقل من ${smallest} يوم` : `Under ${smallest} days`),
      outcome: outcomeText(100, isRTL),
      noRefund: true,
      tier: null,
    });
  }
  return lines;
}
