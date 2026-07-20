/**
 * Shared client-side validation for owner payout accounts (Zain Cash / Qi Card).
 * Used by both the registration flow and the payout-details screen so the two
 * stay in lockstep. Returns an Arabic error message, or null when valid/empty.
 */

export function validateZainCash(text: string): string | null {
  if (!text) {
    return null;
  }
  const clean = text.replace(/[\s\-\(\)]/g, "");

  if (/[^\d+]/.test(clean) || (clean.includes("+") && !clean.startsWith("+"))) {
    return "يجب أن يحتوي رقم الهاتف على أرقام فقط";
  }

  const hasIraqiPrefix =
    clean.startsWith("07") ||
    clean.startsWith("7") ||
    clean.startsWith("+9647") ||
    clean.startsWith("9647") ||
    clean.startsWith("009647");

  if (!hasIraqiPrefix) {
    return "يجب أن يبدأ رقم الهاتف بـ 07 أو 7 أو 9647+";
  }

  if (clean.startsWith("07") && clean.length !== 11) {
    return "رقم الهاتف يجب أن يكون 11 رقماً";
  } else if (clean.startsWith("7") && clean.length !== 10) {
    return "رقم الهاتف يجب أن يكون 10 أرقام";
  } else if (clean.startsWith("+9647") && clean.length !== 13) {
    return "رقم الهاتف يجب أن يكون 13 رقماً";
  } else if (clean.startsWith("9647") && clean.length !== 12) {
    return "رقم الهاتف يجب أن يكون 12 رقماً";
  } else if (clean.startsWith("009647") && clean.length !== 14) {
    return "رقم الهاتف يجب أن يكون 14 رقماً";
  }

  return null;
}

export function validateQiCard(text: string): string | null {
  if (!text) {
    return null;
  }
  const clean = text.replace(/[\s\-\(\)]/g, "");
  if (!/^\d{10}$/.test(clean)) {
    return "يجب أن يتكون رقم بطاقة كي من 10 أرقام";
  }
  return null;
}
