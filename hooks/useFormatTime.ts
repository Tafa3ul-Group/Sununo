import { useCallback } from 'react';
import { useDirection } from "@/i18n";

/**
 * Folds Arabic-Indic (٠-٩) and Extended Arabic-Indic (۰-۹) digits down to ASCII.
 * Shift times authored in the Arabic UI can come back in Arabic numerals, and
 * parseInt only understands ASCII digits — without this "١٢:٣٠" parses as NaN.
 */
const toAsciiDigits = (value: string) =>
  value.replace(/[٠-٩۰-۹]/g, (d) => String(d.charCodeAt(0) & 0xf));

export const useFormatTime = () => {
  const { isRTL } = useDirection();

  const formatShiftTime = useCallback((timeStr?: string) => {
    if (!timeStr) return '';
    
    // Split HH:mm or HH:mm:ss
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;

    const [hours, minutes] = parts;
    const parsed = parseInt(toAsciiDigits(hours), 10);

    // Nothing numeric in the hour: pass the raw value through untouched, like
    // the colon-less branch above. Falling through would hand NaN to `% 12`,
    // whose falsy result trips `|| 12` and invents an hour that was never given.
    if (Number.isNaN(parsed)) return timeStr;

    // "24:00" is a legal end-of-shift value meaning midnight, so fold it to 0
    // before the meridiem decision — otherwise 24 >= 12 picks PM and 24 % 12
    // gives 12, rendering noon: exactly twelve hours wrong.
    const h = parsed === 24 ? 0 : parsed;

    // Determine AM/PM based on language
    const ampm = h >= 12
      ? (isRTL ? 'م' : 'PM')
      : (isRTL ? 'ص' : 'AM');

    // Convert to 12h format
    const h12 = h % 12 || 12;

    return `${h12}:${minutes} ${ampm}`;
  }, [isRTL]);

  return { formatShiftTime };
};
