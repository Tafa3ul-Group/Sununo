import React from 'react';
import { StyleSheet, View, TouchableOpacity, Dimensions } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { MotionIcon } from '@/components/icons/motion-icons';
import { Colors, normalize, Spacing } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

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

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <MotionIcon 
          name={type} 
          size={width * 1.0} 
          style={styles.animation}
        />
        
        <View style={styles.textContainer}>
          <ThemedText type="h2" style={styles.title}>
            {title || (type === 'error404' ? t('error.404.title', 'الصفحة غير موجودة') : t('common.error', 'حدث خطأ ما'))}
          </ThemedText>
          
          {message !== "" && (
            <ThemedText style={styles.message}>
              {message || (type === 'error404' 
                ? t('error.404.shortMessage', 'نعتذر، لم نجد ما تبحث عنه.') 
                : t('common.errorMessage', 'يرجى المحاولة مرة أخرى.'))}
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
                {retryLabel || t('common.retry', 'إعادة المحاولة')}
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
                {backLabel || t('common.goBack', 'العودة')}
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
  animation: {
    marginTop: -Spacing.xl,
    marginBottom: -Spacing.lg },
  textContainer: {
    alignItems: 'center',
    marginTop: -Spacing.md },
  title: {
    textAlign: 'center',
    marginBottom: 4,
    color: '#0F172A',
    fontSize: normalize.font(20),
    fontFamily: 'Alexandria-Bold' },
  message: {
    textAlign: 'center',
    color: '#64748B',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    fontSize: normalize.font(13),
    fontFamily: 'Alexandria-Regular' },
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
    fontFamily: 'Alexandria-Bold',
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
    fontFamily: 'Alexandria-Medium',
    fontSize: normalize.font(14) } });
