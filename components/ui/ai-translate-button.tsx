import { SolarStarBold } from '@/components/icons/solar-icons';
import { Colors } from '@/constants/theme';
import { useDirection } from '@/i18n';
import { translateArToEn, TranslationError } from '@/services/translate';
import React, { useState } from 'react';
import { ActivityIndicator, StyleProp, Text, TouchableOpacity, ViewStyle } from 'react-native';
import Toast from 'react-native-toast-message';

interface AiTranslateButtonProps {
  /** Arabic source text to translate. */
  source: string;
  /** Receives the English translation; wire this to set the EN field. */
  onTranslated: (en: string) => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Small "AI Translate" pill that fills an English field from its Arabic
 * counterpart using Gemini. Drop it next to any (EN) field's label.
 */
export function AiTranslateButton({ source, onTranslated, style }: AiTranslateButtonProps) {
  const { isRTL } = useDirection();
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    if (loading) return;
    const text = (source || '').trim();
    if (!text) {
      Toast.show({
        type: 'info',
        text1: isRTL ? 'أدخل النص بالعربية أولاً' : 'Enter the Arabic text first',
      });
      return;
    }
    try {
      setLoading(true);
      const en = await translateArToEn(text);
      onTranslated(en);
      Toast.show({ type: 'success', text1: isRTL ? 'تمت الترجمة' : 'Translated' });
    } catch (e) {
      const code = e instanceof TranslationError ? e.code : 'UNKNOWN';
      const text1 =
        code === 'NO_KEY'
          ? (isRTL ? 'مفتاح Gemini غير مُهيأ' : 'Gemini API key not configured')
          : code === 'NETWORK'
            ? (isRTL ? 'تعذّر الاتصال بخدمة الترجمة' : 'Could not reach the translation service')
            : (isRTL ? 'فشلت الترجمة، حاول مجدداً' : 'Translation failed, please try again');
      Toast.show({ type: 'error', text1 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={loading}
      activeOpacity={0.7}
      style={[
        {
          flexDirection: isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
          gap: 5,
          backgroundColor: Colors.primary + '12',
          borderRadius: 8,
          paddingHorizontal: 10,
          paddingVertical: 5,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={Colors.primary} />
      ) : (
        <SolarStarBold size={13} color={Colors.primary} />
      )}
      <Text style={{ fontSize: 11, fontFamily: 'Alexandria-Bold', color: Colors.primary }}>
        {loading
          ? (isRTL ? 'جارٍ الترجمة…' : 'Translating…')
          : (isRTL ? 'ترجمة بالذكاء' : 'AI Translate')}
      </Text>
    </TouchableOpacity>
  );
}
