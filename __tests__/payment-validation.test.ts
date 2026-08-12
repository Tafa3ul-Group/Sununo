import {
  validateBankAccount,
  validateBankName,
  validateQiCard,
  validateZainCash,
} from "@/utils/payment-validation";

// Exact strings the validators return. Kept as constants so a wording change in
// the source shows up as one obvious diff instead of thirty.
const ERR_DIGITS_ONLY = "يجب أن يحتوي رقم الهاتف على أرقام فقط";
const ERR_PREFIX = "يجب أن يبدأ رقم الهاتف بـ 07 أو 7 أو 9647+";
const ERR_LEN_11 = "رقم الهاتف يجب أن يكون 11 رقماً";
const ERR_LEN_10 = "رقم الهاتف يجب أن يكون 10 أرقام";
const ERR_LEN_13 = "رقم الهاتف يجب أن يكون 13 رقماً";
const ERR_LEN_12 = "رقم الهاتف يجب أن يكون 12 رقماً";
const ERR_LEN_14 = "رقم الهاتف يجب أن يكون 14 رقماً";

const ERR_QI = "يجب أن يتكون رقم بطاقة كي من 10 أرقام";

const ERR_BANK_REQUIRED = "يرجى إدخال اسم المصرف";
const ERR_BANK_SHORT = "اسم المصرف قصير جداً";
const ERR_BANK_LONG = "اسم المصرف طويل جداً";

const ERR_ACCOUNT_REQUIRED = "يرجى إدخال رقم الحساب أو الآيبان";
const ERR_ACCOUNT_CHARSET = "يجب أن يحتوي رقم الحساب على أرقام وحروف إنجليزية فقط";
const ERR_ACCOUNT_LEN = "رقم الحساب يجب أن يكون بين 6 و 34 خانة";

describe("validateZainCash — empty / optional", () => {
  it("treats an empty string as valid (the field is optional)", () => {
    expect(validateZainCash("")).toBeNull();
  });

  // Whitespace-only is NOT treated as empty: the separators are stripped first,
  // so the value falls through to the prefix check. Documented, not blessed as
  // ideal — the bank validators do trim to empty.
  it("does not treat a whitespace/separator-only value as empty", () => {
    expect(validateZainCash("   ")).toBe(ERR_PREFIX);
    expect(validateZainCash("()-")).toBe(ERR_PREFIX);
  });
});

describe("validateZainCash — accepted national formats", () => {
  it("accepts a local 07 number of 11 digits", () => {
    expect(validateZainCash("07712345678")).toBeNull();
    expect(validateZainCash("07812345678")).toBeNull();
  });

  it("accepts a 10-digit number without the leading zero", () => {
    expect(validateZainCash("7712345678")).toBeNull();
  });

  it("strips spaces, dashes and parentheses before validating", () => {
    expect(validateZainCash("0771 234 5678")).toBeNull();
    expect(validateZainCash("(077)-1234-5678")).toBeNull();
    expect(validateZainCash("  077-123-456-78  ")).toBeNull();
    expect(validateZainCash("771 234 5678")).toBeNull();
  });
});

describe("validateZainCash — character rules", () => {
  it("rejects letters and punctuation that survive the strip", () => {
    expect(validateZainCash("0771234567a")).toBe(ERR_DIGITS_ONLY);
    expect(validateZainCash("077.123.5678")).toBe(ERR_DIGITS_ONLY);
    expect(validateZainCash("٠٧٧١٢٣٤٥٦٧٨")).toBe(ERR_DIGITS_ONLY); // Arabic-Indic digits are not \d
    expect(validateZainCash("زين كاش")).toBe(ERR_DIGITS_ONLY);
  });

  it("rejects a + that is not the first character", () => {
    expect(validateZainCash("0771234+678")).toBe(ERR_DIGITS_ONLY);
    expect(validateZainCash("9647712345678+")).toBe(ERR_DIGITS_ONLY);
  });

  it("allows a leading + through the character check", () => {
    // A lone "+" passes the charset gate and is then caught by the prefix rule.
    expect(validateZainCash("+")).toBe(ERR_PREFIX);
  });
});

describe("validateZainCash — prefix rules", () => {
  it("rejects a number whose prefix is none of the accepted ones", () => {
    expect(validateZainCash("0812345678")).toBe(ERR_PREFIX);
    expect(validateZainCash("12345")).toBe(ERR_PREFIX);
    expect(validateZainCash("0")).toBe(ERR_PREFIX);
    expect(validateZainCash("+964")).toBe(ERR_PREFIX); // needs +9647, not just +964
    expect(validateZainCash("00964")).toBe(ERR_PREFIX);
    expect(validateZainCash("++9647712345678")).toBe(ERR_PREFIX);
  });
});

describe("validateZainCash — length rules per prefix", () => {
  it("requires exactly 11 characters for an 07 number", () => {
    expect(validateZainCash("0771234567")).toBe(ERR_LEN_11); // 10
    expect(validateZainCash("077123456789")).toBe(ERR_LEN_11); // 12
    expect(validateZainCash("07")).toBe(ERR_LEN_11);
  });

  it("requires exactly 10 characters for a bare 7 number", () => {
    expect(validateZainCash("771234567")).toBe(ERR_LEN_10); // 9
    expect(validateZainCash("77123456789")).toBe(ERR_LEN_10); // 11
    expect(validateZainCash("7")).toBe(ERR_LEN_10);
  });

  // The +9647 branch is reachable: the prefix table is matched longest-first, so
  // "+964…" is never mistaken for the bare "0" or "" (national) prefixes.
  // The wording of the error still counts digits, not characters — 964 + 10.
  it("reaches the +9647 branch and enforces its length", () => {
    expect(validateZainCash("+96477123456789")).toBe(ERR_LEN_13); // 15
    expect(validateZainCash("+96477")).toBe(ERR_LEN_13);
  });

  it("reaches the 9647 branch and enforces its length", () => {
    expect(validateZainCash("96477123456789")).toBe(ERR_LEN_12); // 14
    expect(validateZainCash("96477")).toBe(ERR_LEN_12);
  });

  // "009647..." is matched before the shorter "0" trunk prefix, so it is not
  // swallowed by the local-number rule and does reach its own check.
  it("reaches the 009647 branch and enforces its length", () => {
    expect(validateZainCash("0096477123456789")).toBe(ERR_LEN_14); // 16
    expect(validateZainCash("009647")).toBe(ERR_LEN_14);
  });

  it("rejects an absurdly long number", () => {
    expect(validateZainCash(`07${"1".repeat(500)}`)).toBe(ERR_LEN_11);
    expect(validateZainCash(`7${"9".repeat(5000)}`)).toBe(ERR_LEN_10);
  });
});

describe("validateZainCash — international length off-by-one", () => {
  // FIXED: the international branches used to compare clean.length (which counts
  // the "+" and the leading zeros of "00964") against the DIGIT count of the
  // number, so each one was a character short. The expected total is now derived
  // from the prefix length, so a real +964 number — 10 national digits behind a
  // 4-character prefix = 14 characters — is accepted.
  it("accepts a real +964 number (+964 + 10 digits = 14 chars)", () => {
    expect(validateZainCash("+9647712345678")).toBeNull();
    expect(validateZainCash("+964 771 234 5678")).toBeNull();
  });

  it("accepts a real 964 number without the plus (13 chars)", () => {
    expect(validateZainCash("9647712345678")).toBeNull();
  });

  it("accepts a real 00964 number (15 chars)", () => {
    expect(validateZainCash("009647712345678")).toBeNull();
  });

  // The mirror image: with the totals one short, numbers carrying only 9
  // national digits used to be silently accepted.
  it("rejects international numbers that are one digit short", () => {
    expect(validateZainCash("+964771234567")).not.toBeNull();
    expect(validateZainCash("964771234567")).not.toBeNull();
    expect(validateZainCash("00964771234567")).not.toBeNull();
  });
});

describe("validateQiCard", () => {
  it("treats an empty string as valid (the field is optional)", () => {
    expect(validateQiCard("")).toBeNull();
  });

  it("accepts exactly 10 digits", () => {
    expect(validateQiCard("1234567890")).toBeNull();
    expect(validateQiCard("0000000000")).toBeNull();
  });

  it("rejects 9 and 11 digits", () => {
    expect(validateQiCard("123456789")).toBe(ERR_QI);
    expect(validateQiCard("12345678901")).toBe(ERR_QI);
  });

  it("strips spaces, dashes and parentheses before counting", () => {
    expect(validateQiCard("1234 567 890")).toBeNull();
    expect(validateQiCard("(123)-456-7890")).toBeNull();
    expect(validateQiCard("  1234-5678-90  ")).toBeNull();
    // Separators alone never make a short number long enough.
    expect(validateQiCard("123 456 789")).toBe(ERR_QI);
  });

  it("rejects letters and other non-digits", () => {
    expect(validateQiCard("12345678ab")).toBe(ERR_QI);
    expect(validateQiCard("+1234567890")).toBe(ERR_QI);
    expect(validateQiCard("123456789.")).toBe(ERR_QI);
  });

  it("rejects Arabic-Indic digits", () => {
    // \d in JS is ASCII-only, so ٠١٢٣ never satisfies ^\d{10}$.
    expect(validateQiCard("٠١٢٣٤٥٦٧٨٩")).toBe(ERR_QI);
    expect(validateQiCard("١٢٣٤٥٦٧٨٩٠")).toBe(ERR_QI);
  });

  it("rejects a whitespace-only value instead of treating it as empty", () => {
    expect(validateQiCard("   ")).toBe(ERR_QI);
  });

  it("rejects an absurdly long number", () => {
    expect(validateQiCard("9".repeat(5000))).toBe(ERR_QI);
  });
});

describe("validateBankName", () => {
  it("returns null when both fields are empty", () => {
    expect(validateBankName("")).toBeNull();
    expect(validateBankName("", "")).toBeNull();
    expect(validateBankName("", undefined)).toBeNull();
    expect(validateBankName("   ")).toBeNull();
  });

  it("requires the name once an account number is filled", () => {
    expect(validateBankName("", "12345678")).toBe(ERR_BANK_REQUIRED);
    expect(validateBankName("   ", "IQ98NBIQ850123456789012")).toBe(ERR_BANK_REQUIRED);
  });

  it("stays optional when the account is only whitespace", () => {
    expect(validateBankName("", "   ")).toBeNull();
  });

  it("enforces the 2..100 bounds on the trimmed name", () => {
    expect(validateBankName("م")).toBe(ERR_BANK_SHORT); // 1
    expect(validateBankName("  م  ")).toBe(ERR_BANK_SHORT); // 1 after trim
    expect(validateBankName("مص")).toBeNull(); // 2
    expect(validateBankName("م".repeat(100))).toBeNull(); // 100
    expect(validateBankName("م".repeat(101))).toBe(ERR_BANK_LONG); // 101
    expect(validateBankName("a".repeat(5000))).toBe(ERR_BANK_LONG);
  });

  it("accepts ordinary Arabic and English bank names", () => {
    expect(validateBankName("مصرف الرافدين")).toBeNull();
    expect(validateBankName("Bank of Baghdad")).toBeNull();
    expect(validateBankName("  مصرف الرشيد  ", "12345678")).toBeNull();
  });

  it("does not restrict the character set of the name", () => {
    // Free-text field: symbols and digits are allowed as long as the length fits.
    expect(validateBankName("###")).toBeNull();
    expect(validateBankName("12")).toBeNull();
    // Length is measured in UTF-16 units, so one emoji already counts as 2.
    expect(validateBankName("🏦")).toBeNull();
  });
});

describe("validateBankAccount", () => {
  it("returns null when both fields are empty", () => {
    expect(validateBankAccount("")).toBeNull();
    expect(validateBankAccount("", "")).toBeNull();
    expect(validateBankAccount("   ")).toBeNull();
    expect(validateBankAccount("- -")).toBeNull();
  });

  it("requires the account once a bank name is filled", () => {
    expect(validateBankAccount("", "مصرف الرافدين")).toBe(ERR_ACCOUNT_REQUIRED);
    expect(validateBankAccount("   ", "Bank of Baghdad")).toBe(ERR_ACCOUNT_REQUIRED);
  });

  it("stays optional when the bank name is only whitespace", () => {
    expect(validateBankAccount("", "   ")).toBeNull();
  });

  it("enforces the 6..34 bounds after stripping spaces and hyphens", () => {
    expect(validateBankAccount("12345")).toBe(ERR_ACCOUNT_LEN); // 5
    expect(validateBankAccount("123456")).toBeNull(); // 6
    expect(validateBankAccount("1 2 3 4 5")).toBe(ERR_ACCOUNT_LEN); // 5 after strip
    expect(validateBankAccount("A".repeat(34))).toBeNull(); // 34
    expect(validateBankAccount("A".repeat(35))).toBe(ERR_ACCOUNT_LEN); // 35
    expect(validateBankAccount("1".repeat(5000))).toBe(ERR_ACCOUNT_LEN);
  });

  it("accepts a grouped IBAN and a hyphenated account number", () => {
    expect(validateBankAccount("IQ98 NBIQ 8501 2345 6789 01")).toBeNull();
    expect(validateBankAccount("1234-5678-9012")).toBeNull();
    expect(validateBankAccount("iq98nbiq850123456789012", "مصرف الرافدين")).toBeNull();
  });

  it("rejects anything outside A-Z a-z 0-9", () => {
    expect(validateBankAccount("IQ98#NBIQ8501")).toBe(ERR_ACCOUNT_CHARSET);
    expect(validateBankAccount("١٢٣٤٥٦")).toBe(ERR_ACCOUNT_CHARSET); // Arabic-Indic digits
    expect(validateBankAccount("حساب مصرفي")).toBe(ERR_ACCOUNT_CHARSET);
    expect(validateBankAccount("IQ98/NBIQ/8501")).toBe(ERR_ACCOUNT_CHARSET);
  });

  it("reports the character error before the length error", () => {
    // "###" is both too short and illegal; the charset check runs first.
    expect(validateBankAccount("###")).toBe(ERR_ACCOUNT_CHARSET);
  });

  it("does not strip parentheses, unlike the phone/card validators", () => {
    // Intentional difference, not a defect: "(077)" is a real phone-formatting
    // habit, while IBANs/account numbers are only ever grouped with spaces or
    // hyphens. Parentheses here mean the user typed something wrong.
    expect(validateBankAccount("(1234)56789")).toBe(ERR_ACCOUNT_CHARSET);
    expect(validateZainCash("(077)12345678")).toBeNull();
    expect(validateQiCard("(1234)567890")).toBeNull();
  });
});

describe("bank fields as a pair", () => {
  it("flags whichever half is missing, in both directions", () => {
    expect(validateBankName("", "123456")).toBe(ERR_BANK_REQUIRED);
    expect(validateBankAccount("123456", "")).toBeNull();

    expect(validateBankAccount("", "مصرف الرافدين")).toBe(ERR_ACCOUNT_REQUIRED);
    expect(validateBankName("مصرف الرافدين", "")).toBeNull();
  });

  it("passes when both halves are filled correctly", () => {
    expect(validateBankName("مصرف الرافدين", "IQ98 NBIQ 8501 2345 6789 01")).toBeNull();
    expect(validateBankAccount("IQ98 NBIQ 8501 2345 6789 01", "مصرف الرافدين")).toBeNull();
  });
});
