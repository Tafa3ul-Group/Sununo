import React from 'react';
import { View, StyleSheet, Dimensions, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { ThemedText } from '../themed-text';
import { Colors, normalize, Spacing } from '@/constants/theme';
import { PrimaryButton } from '../user/primary-button';
import { SolarInboxLinear } from '@/components/icons/solar-icons';
import { useDirection } from "@/i18n";

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
  const { t } = useTranslation();
  const { isRTL } = useDirection();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        <Animated.View
          entering={ZoomIn.duration(360).springify().damping(14)}
          style={styles.iconContainer}
        >
          {icon || <SolarInboxLinear size={normalize.width(80)} color={Colors.text.muted} />}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(360)}>
          <ThemedText style={styles.title}>
            {title || t('common.noData') || (isRTL ? 'لا توجد بيانات' : 'No Data Found')}
          </ThemedText>
        </Animated.View>

        {description && (
          <Animated.View entering={FadeIn.delay(220).duration(360)}>
            <ThemedText style={styles.description}>
              {description}
            </ThemedText>
          </Animated.View>
        )}

        {actionLabel && onAction && (
          <Animated.View entering={FadeInDown.delay(320).duration(360)} style={{ width: '100%', alignItems: 'center' }}>
            <PrimaryButton
              label={actionLabel}
              onPress={onAction}
              style={styles.button}
            />
          </Animated.View>
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
    paddingVertical: Spacing.xl,
    backgroundColor: 'transparent',
    minHeight: 300 },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%' },
  iconContainer: {
    width: normalize.width(96),
    height: normalize.width(96),
    borderRadius: normalize.radius(48),
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: normalize.height(16) },
  title: {
    fontSize: normalize.font(15),
    fontFamily: "Alexandria-Medium",
    color: Colors.text.primary,
    textAlign: 'center',
    lineHeight: normalize.font(22),
    marginBottom: normalize.height(6) },
  description: {
    fontSize: normalize.font(11),
    fontFamily: "Alexandria-Medium",
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: normalize.font(18),
    maxWidth: 280,
    marginBottom: Spacing.lg },
  button: {
    width: '70%',
    height: normalize.height(52),
    borderRadius: normalize.radius(26) } });
