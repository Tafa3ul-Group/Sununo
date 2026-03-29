import { Colors, normalize, Spacing, Typography } from '@/constants/theme';
import i18n from '@/i18n';
import { RootState } from '@/store';
import { setLanguage, setUserType, UserType } from '@/store/authSlice';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

export default function ChooseTypeScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { language } = useSelector((state: RootState) => state.auth);

  const isRTL = language === 'ar';

  const handleSelectType = (type: UserType) => {
    dispatch(setUserType(type));
    if (type === 'guest') {
      router.replace('/(tabs)');
    } else {
      router.push('/(auth)/login');
    }
  };

  const toggleLanguage = () => {
    const newLang = language === 'ar' ? 'en' : 'ar';
    dispatch(setLanguage(newLang));
    i18n.changeLanguage(newLang);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Language Switcher */}
      <View style={styles.langSwitcherContainer}>
        <TouchableOpacity style={styles.langButton} onPress={toggleLanguage}>
          <Text style={styles.langButtonText}>{language === 'ar' ? 'English' : 'عربي'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('home.welcome')}!</Text>
          <Text style={styles.subtitle}>{t('auth.chooseType')}</Text>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[styles.card, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
            onPress={() => handleSelectType('owner')}
            activeOpacity={0.8}
          >
            <View style={[styles.iconContainer, {
              backgroundColor: '#E3F2FD',
              marginLeft: isRTL ? Spacing.md : 0,
              marginRight: isRTL ? 0 : Spacing.md
            }]}>
              <Text style={styles.emoji}>🏡</Text>
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('auth.owner')}</Text>
              <Text style={[styles.cardDescription, { textAlign: isRTL ? 'right' : 'left' }]}>{t('auth.ownerDesc')}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
            onPress={() => handleSelectType('customer')}
            activeOpacity={0.8}
          >
            <View style={[styles.iconContainer, {
              backgroundColor: '#FFF3E0',
              marginLeft: isRTL ? Spacing.md : 0,
              marginRight: isRTL ? 0 : Spacing.md
            }]}>
              <Text style={styles.emoji}>👤</Text>
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t('auth.customer')}</Text>
              <Text style={[styles.cardDescription, { textAlign: isRTL ? 'right' : 'left' }]}>{t('auth.customerDesc')}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.guestButton}
          onPress={() => handleSelectType('guest')}
        >
          <Text style={styles.guestButtonText}>{t('auth.browseAsGuest')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Secure & Premium Chalet Booking</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  langSwitcherContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    alignItems: 'flex-start',
  },
  langButton: {
    paddingVertical: normalize.height(6),
    paddingHorizontal: normalize.width(12),
    borderRadius: normalize.radius(20),
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  langButtonText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
    fontSize: normalize.font(12),
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  header: {
    marginBottom: Spacing.xl * 2,
    alignItems: 'center',
  },
  title: {
    ...Typography.h1,
    fontSize: normalize.font(32),
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontSize: normalize.font(16),
  },
  optionsContainer: {
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: normalize.radius(20),
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  iconContainer: {
    width: normalize.width(60),
    height: normalize.width(60),
    borderRadius: normalize.radius(30),
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: normalize.font(24),
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    ...Typography.h2,
    width: '100%',
    marginBottom: normalize.height(4),
    fontSize: normalize.font(18),
  },
  cardDescription: {
    ...Typography.caption,
    width: '100%',
    color: Colors.text.secondary,
    lineHeight: normalize.font(18),
    fontSize: normalize.font(13),
  },
  guestButton: {
    marginTop: Spacing.xl,
    alignItems: 'center',
    padding: Spacing.md,
  },
  guestButtonText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
    fontSize: normalize.font(14),
  },
  footer: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    ...Typography.caption,
    color: Colors.text.muted,
    fontSize: normalize.font(12),
  },
});


