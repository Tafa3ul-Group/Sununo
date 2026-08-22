import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { SolarDangerTriangleBold, SolarMagnifierBold } from '@/components/icons/solar-icons';
import { Colors, normalize, Spacing } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

// أيقونة ساكنة داخل دائرة بلون البراند. كانت Lottie بعرض الشاشة كامل
// (`width * 1.0`) مغطّاة بهوامش سالبة، وحلقتها تطلع فارغة بلا علامة.
// `Colors.error` برتقالي لا أحمر — البراند مستبدل الأحمر عمداً (constants/theme.ts).
const BADGE = {
  failed:   { Icon: SolarDangerTriangleBold, tint: Colors.error,   bg: '#FFF7ED' },
  error404: { Icon: SolarMagnifierBold,      tint: Colors.primary, bg: '#EFF6FF' },
} as const;

interface ErrorStateProps {
  type?: 'failed' | 'error404';
  title?: string;
  message?: string;
  onRetry?: () => void;
  onBack?: () => void;
  retryLabel?: string;
  backLabel?: string;
}

export const ErrorState = ({
  type = 'failed',
  title,
  message,
  onRetry,
  onBack,
  retryLabel,
  backLabel }: ErrorStateProps) => {
  const { t } = useTranslation();

  // Every string below is keyed in BOTH i18n/en.json and i18n/ar.json, so no
  // t() call carries an inline default. A hard-coded Arabic default silently
  // wins whenever the key is missing from en.json, which is how English users
  // ended up reading an Arabic retry button; without one, a missing key shows
  // up as the key itself and gets noticed.
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.badge, { backgroundColor: BADGE[type].bg }]}>
          {React.createElement(BADGE[type].Icon, {
            size: normalize.font(44),
            color: BADGE[type].tint,
          })}
        </View>
        
        <View style={styles.textContainer}>
          <ThemedText type="h2" style={styles.title}>
            {title || (type === 'error404' ? t('error.404.title') : t('common.error'))}
          </ThemedText>
          
          {message !== "" && (
            <ThemedText style={styles.message}>
              {message || (type === 'error404'
                ? t('error.404.shortMessage')
                : t('common.errorMessage'))}
            </ThemedText>
          )}
        </View>

        <View style={styles.actions}>
          {onRetry && (
            <TouchableOpacity 
              activeOpacity={0.8}
              style={styles.retryButton} 
              onPress={onRetry}
            >
              <ThemedText style={styles.retryButtonText}>
                {retryLabel || t('common.retry')}
              </ThemedText>
            </TouchableOpacity>
          )}
          
          {onBack && (
            <TouchableOpacity 
              activeOpacity={0.7}
              style={styles.backButton} 
              onPress={onBack}
            >
              <ThemedText style={styles.backButtonText}>
                {backLabel || t('common.goBack')}
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl },
  badge: {
    width: normalize.width(96),
    height: normalize.width(96),
    borderRadius: normalize.width(48),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg },
  textContainer: {
    alignItems: 'center' },
  title: {
    textAlign: 'center',
    marginBottom: 4,
    color: '#0F172A',
    fontSize: normalize.font(18),
    lineHeight: normalize.font(27),
    fontFamily: "IBMPlexSansArabic-SemiBold" },
  message: {
    textAlign: 'center',
    color: '#64748B',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    fontSize: normalize.font(15),
    lineHeight: normalize.font(23),
    fontFamily: "IBMPlexSansArabic-Regular" },
  actions: {
    width: '100%',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: normalize.height(12),
    borderRadius: normalize.radius(12),
    alignItems: 'center' },
  retryButtonText: {
    color: Colors.white,
    fontFamily: "IBMPlexSansArabic-SemiBold",
    fontSize: normalize.font(14) },
  backButton: {
    paddingVertical: normalize.height(12),
    borderRadius: normalize.radius(12),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    backgroundColor: '#F8FAFC' },
  backButtonText: {
    color: '#64748B',
    fontFamily: "IBMPlexSansArabic-SemiBold",
    fontSize: normalize.font(14) } });
