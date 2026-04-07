import React, { forwardRef, useCallback, useMemo } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  I18nManager 
} from 'react-native';
import { 
  BottomSheetModal, 
  BottomSheetBackdrop, 
  BottomSheetView 
} from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Colors, normalize } from '@/constants/theme';

export const LanguageBottomSheet = forwardRef<BottomSheetModal>((props, ref) => {
  const { t, i18n } = useTranslation();
  
  const snapPoints = useMemo(() => ['30%'], []);

  const renderBackdrop = useCallback(
    (backdropProps: any) => (
      <BottomSheetBackdrop
        {...backdropProps}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  const changeLanguage = async (lng: string) => {
    const isRtl = lng === 'ar';
    
    // Save to storage
    await AsyncStorage.setItem('user-language', lng);
    
    // Update i18next
    await i18n.changeLanguage(lng);
    
    // Force RTL if needed
    if (I18nManager.isRTL !== isRtl) {
      I18nManager.forceRTL(isRtl);
      I18nManager.allowRTL(isRtl);
      
      // Since expo-updates is not available, we inform use it might need restart
      // Some versions of Expo Router react to lng change if styles use i18n.language
    }

    // @ts-ignore
    ref?.current?.dismiss();
  };

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
    >
      <BottomSheetView style={styles.contentContainer}>
        <ThemedText style={styles.title}>{t('profile.selectLanguage')}</ThemedText>
        
        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={[styles.option, i18n.language === 'ar' && styles.activeOption]} 
            onPress={() => changeLanguage('ar')}
          >
            <ThemedText style={[styles.optionText, i18n.language === 'ar' && styles.activeText]}>
              {t('profile.arabic')}
            </ThemedText>
            {i18n.language === 'ar' && <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.option, i18n.language === 'en' && styles.activeOption]} 
            onPress={() => changeLanguage('en')}
          >
            <ThemedText style={[styles.optionText, i18n.language === 'en' && styles.activeText]}>
              {t('profile.english')}
            </ThemedText>
            {i18n.language === 'en' && <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />}
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  contentContainer: {
    padding: normalize.width(20),
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: normalize.height(20),
    textAlign: 'center',
    color: '#1A1A1A',
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: normalize.width(16),
    borderRadius: 16,
    backgroundColor: '#F8F9FB',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  activeOption: {
    borderColor: Colors.primary,
    backgroundColor: '#EEF4FF',
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
  },
  activeText: {
    color: Colors.primary,
    fontWeight: '700',
  },
});
