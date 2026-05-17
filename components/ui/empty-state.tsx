import React from 'react';
import { View, StyleSheet, Dimensions, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemedText } from '../themed-text';
import { Colors, normalize, Spacing } from '@/constants/theme';
import { PrimaryButton } from '../user/primary-button';
import { SolarInboxLinear } from '@/components/icons/solar-icons';
import { isRTL } from "@/i18n";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  style }) => {
  const { t, i18n } = useTranslation();
  
  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {icon || <SolarInboxLinear size={normalize.width(80)} color={Colors.text.muted} />}
        </View>
        
        <ThemedText style={styles.title}>
          {title || t('common.noData') || (isRTL ? 'لا توجد بيانات' : 'No Data Found')}
        </ThemedText>
        
        {description && (
          <ThemedText style={styles.description}>
            {description}
          </ThemedText>
        )}

        {actionLabel && onAction && (
          <PrimaryButton 
            label={actionLabel} 
            onPress={onAction} 
            style={styles.button}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    backgroundColor: 'transparent',
    minHeight: 300 },
  content: {
    alignItems: 'center',
    width: '100%' },
  iconContainer: {
    width: normalize.width(140),
    height: normalize.width(140),
    borderRadius: normalize.radius(70),
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg },
  title: {
    fontSize: normalize.font(20),
    fontFamily: 'Alexandria-Medium',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm },
  description: {
    fontSize: normalize.font(15),
    fontFamily: 'Alexandria-Medium',
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: normalize.font(22),
    marginBottom: Spacing.xl },
  button: {
    width: '70%',
    height: normalize.height(52),
    borderRadius: normalize.radius(26) } });
