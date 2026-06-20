/**
 * Utility functions for formatting numbers and currencies.
 */

/**
 * Formats a number as a currency string.
 * @param amount - The numeric value to format.
 * @param includeCurrency - Whether to include the currency symbol (e.g., "د.ع").
 * @returns A formatted string.
 */
export const formatPrice = (amount: number | string | undefined | null, includeCurrency: boolean = false): string => {
  if (amount === undefined || amount === null || amount === '') return '0';
  
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) return '0';

  // Format with thousand separators
  const formatted = numericAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  
  return includeCurrency ? `${formatted} د.ع` : formatted;
};

/**
 * Formats a short currency symbol display.
 * Useful for small UI components like badges.
 */
export const currencySymbol = 'د.ع';

/**
 * Resolves the lowest ("starts from") price for a chalet, for use on home/search
 * cards. Prefers the `startingPrice` computed by the API, and falls back to
 * deriving the minimum from the chalet's shift pricing when the full nested
 * `shifts` are available.
 *
 * A price of <= 1 is the sentinel for a closed/unavailable day and is excluded
 * so it is never shown as the real minimum.
 *
 * @returns A formatted, thousand-separated string ("0" when no price exists).
 */
export const getStartingPrice = (chalet: any): string => {
  if (!chalet) return '0';

  // 1. API-provided starting price (lowest active shift pricing).
  if (chalet.startingPrice != null && Number(chalet.startingPrice) > 0) {
    return formatPrice(chalet.startingPrice);
  }

  // 2. Fallback: derive the minimum from the nested shifts/pricing if present.
  if (Array.isArray(chalet.shifts) && chalet.shifts.length > 0) {
    const prices: number[] = chalet.shifts
      .flatMap((s: any) => s?.pricing?.map((p: any) => Number(p.price)) ?? [])
      .filter((p: number) => Number.isFinite(p) && p > 1);
    if (prices.length > 0) {
      return formatPrice(Math.min(...prices));
    }
  }

  // 3. Last resort: legacy single price field.
  if (chalet.price != null && Number(chalet.price) > 0) {
    return formatPrice(chalet.price);
  }

  return '0';
};
