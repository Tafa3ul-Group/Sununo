import { pickTranslation } from "../i18n/direction";

/**
 * Utility functions for formatting numbers and currencies.
 */

/**
 * Formats a short currency symbol display.
 * Useful for small UI components like badges.
 */
export const currencySymbol = 'د.ع';

/**
 * Parses anything the API (or our own card lists) may hand us as an amount.
 *
 * List screens store the ALREADY FORMATTED price back onto the card item
 * (`price: getStartingPrice(item)`), so a value can come back in as "80,000".
 * `parseFloat` stops at the first comma, so the separators are stripped before
 * parsing — otherwise a re-formatted amount silently collapses to "1".
 *
 * @returns The numeric value, or NaN when the input is not a number at all.
 */
const parseAmount = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return NaN;
  return parseFloat(value.replace(/,/g, ''));
};

/**
 * Renders a finite number in plain decimal notation.
 *
 * `toString()` switches to exponential form at 1e21 (and for very small
 * magnitudes), which the digit-grouping regex cannot handle — huge chalet
 * totals would render as "1e+21". Integers of that size are exact in BigInt,
 * so it can expand them losslessly.
 */
const toPlainDigits = (value: number): string => {
  const raw = value.toString();
  if (!raw.includes('e') && !raw.includes('E')) return raw;
  if (Number.isInteger(value)) return BigInt(value).toString();
  // Tiny magnitudes (<= 1e-7): expand and drop the padding zeros toFixed adds.
  return value.toFixed(20).replace(/0+$/, '').replace(/\.$/, '');
};

/**
 * Groups the INTEGER part in thousands. The fraction is re-attached untouched:
 * running the regex over the whole string separates the decimals too
 * ("12,345.6,789").
 */
const groupThousands = (plain: string): string => {
  const [integerPart, fractionPart] = plain.split('.');
  const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return fractionPart === undefined ? grouped : `${grouped}.${fractionPart}`;
};

/**
 * Formats a number as a currency string.
 * @param amount - The numeric value to format.
 * @param includeCurrency - Whether to include the currency symbol (e.g., "د.ع").
 * @returns A formatted string.
 */
export const formatPrice = (amount: number | string | undefined | null, includeCurrency: boolean = false): string => {
  // Every return goes through here so the fallbacks keep the currency suffix —
  // otherwise the same sentence reads "0 د.ع" for 0 but a bare "0" for null.
  const withCurrency = (value: string) => (includeCurrency ? `${value} ${currencySymbol}` : value);

  if (amount === undefined || amount === null || amount === '') return withCurrency('0');

  const numericAmount = parseAmount(amount);

  // Non-finite values (NaN, ±Infinity) degrade to "0" rather than leaking the
  // literal word "Infinity" into the UI, matching formatDuration's guard.
  if (!Number.isFinite(numericAmount)) return withCurrency('0');

  return withCurrency(groupThousands(toPlainDigits(numericAmount)));
};

/**
 * Formats a duration in minutes as human text: "ساعتان و30 دقيقة" / "2h 30m".
 * Used for the post-approval payment deadline, which the owner edits in
 * 15-minute steps, so sub-hour values must read naturally.
 *
 * @param minutes - Duration in minutes. Values <= 0 mean "no limit".
 * @param isRTL - Arabic when true, English otherwise.
 */
export const formatDuration = (minutes: number, isRTL: boolean): string => {
  if (!Number.isFinite(minutes) || minutes <= 0) return isRTL ? 'بدون مهلة' : 'No limit';

  let hours = Math.floor(minutes / 60);
  let mins = Math.round(minutes % 60);

  // Rounding the remainder can land on a full 60 (59.6 -> 60): carry it into
  // the hours instead of printing "60m".
  if (mins === 60) {
    hours += 1;
    mins = 0;
  }

  // A positive duration under half a minute rounds down to nothing at all, and
  // with no hours either the parts would join to an EMPTY string. Show the
  // smallest unit we can express rather than nothing.
  if (hours === 0 && mins === 0) mins = 1;

  const parts: string[] = [];

  if (isRTL) {
    if (hours === 1) parts.push('ساعة');
    else if (hours === 2) parts.push('ساعتان');
    // Arabic counts 3–10 with the plural of paucity ("ساعات") and goes back to
    // the singular from 11 up ("11 ساعة").
    else if (hours >= 3 && hours <= 10) parts.push(`${hours} ساعات`);
    else if (hours > 10) parts.push(`${hours} ساعة`);
    if (mins === 30 && hours === 0) parts.push('نصف ساعة');
    else if (mins > 0) parts.push(`${mins} دقيقة`);
    return parts.join(' و');
  }

  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}m`);
  return parts.join(' ');
};

/**
 * Resolves the lowest ("starts from") price for a chalet, for use on home/search
 * cards. Prefers the `startingPrice` computed by the API, and falls back to
 * deriving the minimum from the chalet's shift pricing when the full nested
 * `shifts` are available.
 *
 * A price of <= 1 is the sentinel for a closed/unavailable day and is excluded
 * so it is never shown as the real minimum.
 *
 * Amounts are read through `parseAmount`, so a chalet that already carries a
 * formatted price (card items store the formatted string back onto `price`)
 * resolves to that same price instead of dropping to "0".
 *
 * @returns A formatted, thousand-separated string ("0" when no price exists).
 */
export const getStartingPrice = (chalet: any): string => {
  if (!chalet) return '0';

  // 1. API-provided starting price (lowest active shift pricing).
  if (chalet.startingPrice != null && parseAmount(chalet.startingPrice) > 0) {
    return formatPrice(chalet.startingPrice);
  }

  // 2. Fallback: derive the minimum from the nested shifts/pricing if present.
  if (Array.isArray(chalet.shifts) && chalet.shifts.length > 0) {
    const prices: number[] = chalet.shifts
      .flatMap((s: any) => s?.pricing?.map((p: any) => parseAmount(p.price)) ?? [])
      .filter((p: number) => Number.isFinite(p) && p > 1);
    if (prices.length > 0) {
      return formatPrice(Math.min(...prices));
    }
  }

  // 3. Last resort: legacy single price field.
  if (chalet.price != null && parseAmount(chalet.price) > 0) {
    return formatPrice(chalet.price);
  }

  return '0';
};

/**
 * What a chalet card prints under its name: the city first, then the area
 * inside it ("Basra - Al-Jazair"). Cards used to show the region alone, which
 * left out the one thing a customer scans for. Either half may be missing on a
 * given payload, so whatever is present is joined and nothing is invented.
 */
export const formatChaletLocation = (chalet: any, isRTL: boolean): string => {
  const city = pickTranslation(chalet?.city, isRTL);
  const region = pickTranslation(chalet?.region, isRTL);
  return [city, region].filter(Boolean).join(' - ');
};
