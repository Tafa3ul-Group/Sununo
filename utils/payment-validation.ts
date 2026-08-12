/**
 * Shared client-side validation for owner payout accounts (Zain Cash / Qi Card /
 * bank account). Used by both the registration flow and the payout-details
 * screen so the two stay in lockstep. Returns an Arabic error message, or null
 * when valid/empty.
 */

// Every accepted Iraqi mobile is the same 10-digit national number ("7" + 9
// digits) carrying one of five prefixes. Listing the prefixes here and deriving
// the expected total length from `code.length + NSN_DIGITS` is what keeps the
// branches honest: the previous version hand-counted a total per branch and
// compared it against the *string* length, so the "+" and the leading zeros of
// "00964" were counted as digits and every international number came out one
// character short — a real +964 number was rejected while a nine-digit one was
// waved through. The error wording is left exactly as it shipped so translations
// and the parallel copy in the withdraw sheet stay recognisable.
const NSN_DIGITS = 10;

// Longest-first, because "00964…" would otherwise be swallowed by the bare "0"
// trunk prefix and never reach its own length rule.
const ZAIN_PREFIXES: { code: string; lengthError: string }[] = [
  { code: "00964", lengthError: "رقم الهاتف يجب أن يكون 14 رقماً" },
  { code: "+964", lengthError: "رقم الهاتف يجب أن يكون 13 رقماً" },
  { code: "964", lengthError: "رقم الهاتف يجب أن يكون 12 رقماً" },
  { code: "0", lengthError: "رقم الهاتف يجب أن يكون 11 رقماً" },
  { code: "", lengthError: "رقم الهاتف يجب أن يكون 10 أرقام" },
];

export function validateZainCash(text: string): string | null {
  if (!text) {
    return null;
  }
  const clean = text.replace(/[\s\-\(\)]/g, "");

  if (/[^\d+]/.test(clean) || (clean.includes("+") && !clean.startsWith("+"))) {
    return "يجب أن يحتوي رقم الهاتف على أرقام فقط";
  }

  // The "7" is part of the national number, not the prefix, but it has to match
  // here too — "+964" alone or a "08…" landline is not a mobile we can pay out to.
  const format = ZAIN_PREFIXES.find((p) => clean.startsWith(`${p.code}7`));

  if (!format) {
    return "يجب أن يبدأ رقم الهاتف بـ 07 أو 7 أو 9647+";
  }

  if (clean.length !== format.code.length + NSN_DIGITS) {
    return format.lengthError;
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

// The two bank fields validate as a pair: an account number is useless to the
// admin without the bank it belongs to, and vice versa. Mirrors the API, which
// accepts 6-34 letters/digits (an IBAN or a plain account number).
export function validateBankName(text: string, account?: string): string | null {
  const clean = text.trim();
  if (!clean) {
    return account && account.trim() ? "يرجى إدخال اسم المصرف" : null;
  }
  if (clean.length < 2) {
    return "اسم المصرف قصير جداً";
  }
  if (clean.length > 100) {
    return "اسم المصرف طويل جداً";
  }
  return null;
}

export function validateBankAccount(text: string, bankName?: string): string | null {
  const clean = text.replace(/[\s\-]/g, "");
  if (!clean) {
    return bankName && bankName.trim() ? "يرجى إدخال رقم الحساب أو الآيبان" : null;
  }
  if (!/^[A-Za-z0-9]+$/.test(clean)) {
    return "يجب أن يحتوي رقم الحساب على أرقام وحروف إنجليزية فقط";
  }
  if (clean.length < 6 || clean.length > 34) {
    return "رقم الحساب يجب أن يكون بين 6 و 34 خانة";
  }
  return null;
}
