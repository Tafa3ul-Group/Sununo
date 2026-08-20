// Iraqi banks offered in the bank-name dropdown wherever bank info is entered.
// The backend stores bankName as a plain string, so this list is presentation
// only — a saved value outside it renders as the "أخرى" free-text fallback.
// Keep in sync with sununo-portal/app/utils/banks.ts (the admin portal).
export const IRAQI_BANKS: readonly string[] = [
  "مصرف الرافدين",
  "مصرف الرشيد",
  "المصرف العراقي للتجارة (TBI)",
  "مصرف بغداد",
  "المصرف الأهلي العراقي",
  "مصرف الشرق الأوسط العراقي للاستثمار",
  "مصرف آشور الدولي",
  "مصرف الخليج التجاري",
  "مصرف سومر التجاري",
  "مصرف عبر العراق",
  "مصرف الاتحاد العراقي",
  "مصرف الوطنية الإسلامي",
  "مصرف العراق الإسلامي",
  "المصرف العراقي الإسلامي للاستثمار والتنمية",
  "مصرف كوردستان الدولي",
  "مصرف جيهان",
  "مصرف الموصل للتنمية والاستثمار",
  "المصرف المتحد للاستثمار",
  "مصرف الائتمان العراقي",
  "مصرف التنمية الدولي",
  "مصرف زين العراق الإسلامي",
  "المصرف الوطني الإسلامي",
];

// Sentinel for the "أخرى / Other" choice — never persisted as-is; picking it
// reveals a free-text input for unlisted banks.
export const OTHER_BANK_OPTION = "__OTHER__";
