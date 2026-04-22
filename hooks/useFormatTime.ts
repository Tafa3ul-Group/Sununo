import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export const useFormatTime = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const formatShiftTime = useCallback((timeStr?: string) => {
    if (!timeStr) return '';
    
    // Split HH:mm or HH:mm:ss
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;

    const [hours, minutes] = parts;
    const h = parseInt(hours, 10);
    
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
