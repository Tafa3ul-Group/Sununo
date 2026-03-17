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
